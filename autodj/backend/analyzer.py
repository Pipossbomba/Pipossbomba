"""Deep audio analysis module — extracts rich musical features from each track."""

import numpy as np
import librosa
import soundfile as sf
from dataclasses import dataclass, asdict
from typing import Optional
import logging

logger = logging.getLogger(__name__)

CHROMA_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Krumhansl-Kessler key profiles
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def detect_key(y: np.ndarray, sr: int) -> tuple[str, str]:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)

    major_scores = [np.corrcoef(np.roll(MAJOR_PROFILE, i), chroma_mean)[0, 1] for i in range(12)]
    minor_scores = [np.corrcoef(np.roll(MINOR_PROFILE, i), chroma_mean)[0, 1] for i in range(12)]

    best_major_idx = int(np.argmax(major_scores))
    best_minor_idx = int(np.argmax(minor_scores))

    if max(major_scores) >= max(minor_scores):
        return CHROMA_KEYS[best_major_idx], "major"
    return CHROMA_KEYS[best_minor_idx], "minor"


def compute_lufs(y: np.ndarray, sr: int) -> float:
    """Approximate integrated loudness in LUFS (simplified ITU-R BS.1770)."""
    # K-weighting: high-shelf + high-pass
    from scipy.signal import butter, sosfilt

    # High-shelf pre-filter
    sos_shelf = butter(2, 1681.97 / (sr / 2), btype="high", output="sos")
    y_shelf = sosfilt(sos_shelf, y)

    # High-pass filter
    sos_hp = butter(2, 38.13 / (sr / 2), btype="high", output="sos")
    y_filtered = sosfilt(sos_hp, y_shelf)

    ms_energy = np.mean(y_filtered ** 2)
    if ms_energy == 0:
        return -70.0
    return float(10 * np.log10(ms_energy) - 0.691)


def detect_energy_events(energy_curve: list[float], sr_curve: float = 2.0) -> dict:
    """Detect drops, buildups, and breakdowns from energy curve."""
    arr = np.array(energy_curve)
    if len(arr) < 4:
        return {"drops": [], "buildups": [], "breakdowns": []}

    smoothed = np.convolve(arr, np.ones(4) / 4, mode="same")
    diff = np.diff(smoothed)

    drops, buildups, breakdowns = [], [], []
    threshold = float(np.std(arr)) * 1.2

    for i in range(len(diff)):
        t = i / sr_curve
        if diff[i] < -threshold:
            drops.append(round(t, 2))
        elif diff[i] > threshold:
            buildups.append(round(t, 2))

    # Breakdown = sustained low energy region
    low_mask = smoothed < (float(np.mean(smoothed)) * 0.6)
    in_region = False
    start = 0
    for i, low in enumerate(low_mask):
        if low and not in_region:
            in_region = True
            start = i
        elif not low and in_region:
            in_region = False
            duration = (i - start) / sr_curve
            if duration > 2.0:
                breakdowns.append({"start": round(start / sr_curve, 2), "duration": round(duration, 2)})

    return {"drops": drops[:5], "buildups": buildups[:5], "breakdowns": breakdowns[:3]}


def find_best_exit_zone(y: np.ndarray, sr: int, bpm: float, beats: np.ndarray) -> dict:
    """Find the 64-beat window near the end with lowest average energy."""
    if len(beats) < 64:
        duration = len(y) / sr
        return {"start_seconds": max(0.0, duration - 30), "end_seconds": duration}

    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)

    # Only consider last 75% of beats
    candidate_start = len(beats) // 4
    best_energy = float("inf")
    best_start = beats[max(candidate_start, len(beats) - 128)]

    for i in range(max(candidate_start, len(beats) - 128), max(1, len(beats) - 64)):
        start_t = beats[i]
        end_t = beats[min(i + 64, len(beats) - 1)]
        mask = (times >= start_t) & (times <= end_t)
        if mask.sum() == 0:
            continue
        avg_energy = float(np.mean(rms[mask]))
        if avg_energy < best_energy:
            best_energy = avg_energy
            best_start = start_t

    window_end = beats[min(int(np.searchsorted(beats, best_start)) + 64, len(beats) - 1)]
    return {"start_seconds": round(float(best_start), 3), "end_seconds": round(float(window_end), 3)}


def find_best_entry_zone(y: np.ndarray, sr: int, bpm: float, beats: np.ndarray) -> dict:
    """Find first 64-beat window that builds energy."""
    if len(beats) < 64:
        return {"start_seconds": 0.0, "end_seconds": min(30.0, len(y) / sr)}

    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)

    # Look in first 50% of the track
    end_search = min(len(beats) // 2, len(beats) - 64)
    best_slope = -float("inf")
    best_start_t = beats[0]

    for i in range(0, max(1, end_search)):
        start_t = beats[i]
        end_t = beats[min(i + 64, len(beats) - 1)]
        mask = (times >= start_t) & (times <= end_t)
        if mask.sum() < 2:
            continue
        window_rms = rms[mask]
        slope = float(np.polyfit(np.arange(len(window_rms)), window_rms, 1)[0])
        if slope > best_slope:
            best_slope = slope
            best_start_t = start_t

    window_end_idx = min(int(np.searchsorted(beats, best_start_t)) + 64, len(beats) - 1)
    return {"start_seconds": round(float(best_start_t), 3), "end_seconds": round(float(beats[window_end_idx]), 3)}


def detect_silence(y: np.ndarray, sr: int, threshold_db: float = -60.0) -> dict:
    threshold_linear = 10 ** (threshold_db / 20)
    start_silence = 0.0
    end_silence = 0.0

    chunk = sr // 100  # 10ms chunks
    for i in range(0, min(sr * 5, len(y)), chunk):
        if np.max(np.abs(y[i : i + chunk])) > threshold_linear:
            start_silence = i / sr
            break

    for i in range(len(y) - chunk, max(len(y) - sr * 5, 0), -chunk):
        if np.max(np.abs(y[i : i + chunk])) > threshold_linear:
            end_silence = (len(y) - (i + chunk)) / sr
            break

    return {"start_seconds": round(start_silence, 3), "end_seconds": round(max(0.0, end_silence), 3)}


def analyze_track(file_path: str) -> dict:
    """Full deep analysis of a single audio track."""
    logger.info(f"Analyzing: {file_path}")

    y, sr = librosa.load(file_path, sr=22050, mono=True)
    duration = len(y) / sr

    # BPM and beat frames
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(tempo) if np.isscalar(tempo) else float(tempo[0])
    beats = librosa.frames_to_time(beat_frames, sr=sr)
    beat_intervals = np.diff(beats)
    tempo_stability = float(1.0 / (1.0 + np.std(beat_intervals))) if len(beat_intervals) > 1 else 0.5

    # Musical key
    key, mode = detect_key(y, sr)

    # Energy curve — RMS every 500ms
    hop_length = int(sr * 0.5)
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    energy_curve = [round(float(v), 6) for v in rms.tolist()]

    # Spectral centroid curve — brightness over time
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop_length)[0]
    spectral_centroid_curve = [round(float(v), 2) for v in centroid.tolist()]

    # Danceability — beat consistency (autocorrelation of beat intervals)
    if len(beat_intervals) > 4:
        ac = np.correlate(beat_intervals, beat_intervals, mode="full")
        ac = ac[len(ac) // 2:]
        danceability = float(np.clip(ac[1] / (ac[0] + 1e-9), 0, 1))
    else:
        danceability = 0.5

    # Mood vector
    energy_score = float(np.clip(np.mean(rms) * 20, 0, 1))

    spectral_flux = np.mean(np.abs(np.diff(centroid)))
    tension_score = float(np.clip(spectral_flux / 500, 0, 1))

    brightness_score = float(np.clip(np.mean(centroid) / 4000, 0, 1))

    groove_score = float(np.clip(danceability * tempo_stability, 0, 1))

    mood_vector = {
        "energy": round(energy_score, 4),
        "tension": round(tension_score, 4),
        "brightness": round(brightness_score, 4),
        "groove": round(groove_score, 4),
    }

    # LUFS loudness
    loudness_lufs = round(compute_lufs(y, sr), 2)

    # Energy events
    energy_events = detect_energy_events(energy_curve)

    # Exit/entry zones
    exit_zone = find_best_exit_zone(y, sr, bpm, beats)
    entry_zone = find_best_entry_zone(y, sr, bpm, beats)

    # Silence
    silence = detect_silence(y, sr)

    return {
        "file_path": file_path,
        "duration_seconds": round(duration, 3),
        "bpm": round(bpm, 2),
        "key": key,
        "mode": mode,
        "energy_curve": energy_curve,
        "spectral_centroid_curve": spectral_centroid_curve,
        "danceability": round(danceability, 4),
        "mood_vector": mood_vector,
        "loudness_lufs": loudness_lufs,
        "tempo_stability": round(tempo_stability, 4),
        "best_exit_zone": exit_zone,
        "best_entry_zone": entry_zone,
        "energy_events": energy_events,
        "silence": silence,
        "beat_count": len(beats),
        "sample_rate": sr,
    }
