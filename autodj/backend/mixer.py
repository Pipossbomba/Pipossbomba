"""Transition executor — assembles the full mix from AI plans + audio effects."""

import logging
import math
import os
from typing import Any, Callable

import librosa
import numpy as np
import soundfile as sf
from pydub import AudioSegment

from effects import (
    SR,
    apply_bpm_stretch,
    bass_boost,
    bass_cut,
    echo_freeze,
    filter_sweep,
    highpass_filter,
    loop_roll,
    lowpass_filter,
    pitch_shift,
    reverse_reverb,
    reverb_tail,
    sidechain_pump,
    silence_drop,
    stutter,
    vinyl_brake,
    white_noise_sweep,
)

logger = logging.getLogger(__name__)


# ── Crossfade curves ──────────────────────────────────────────────────────────

def _fade_curves(n: int, curve: str) -> tuple[np.ndarray, np.ndarray]:
    t = np.linspace(0, 1, max(n, 1), dtype=np.float32)
    if curve == "linear":
        fade_out = 1 - t
        fade_in = t
    elif curve == "exponential":
        fade_out = np.exp(-4 * t)
        fade_in = 1 - np.exp(-4 * t)
    elif curve == "logarithmic":
        fade_out = np.log1p(1 - t) / np.log(2)
        fade_in = np.log1p(t) / np.log(2)
    elif curve == "s_curve":
        fade_in = t ** 2 * (3 - 2 * t)
        fade_out = 1 - fade_in
    elif curve in ("sudden_cut", "instant"):
        mid = n // 2
        fade_out = np.concatenate([np.ones(mid), np.zeros(n - mid)]).astype(np.float32)
        fade_in = 1 - fade_out
    else:  # default linear
        fade_out = 1 - t
        fade_in = t
    return fade_out, fade_in


# ── Effect dispatcher ─────────────────────────────────────────────────────────

def _apply_effect(y: np.ndarray, effect: dict[str, Any], bpm: float) -> np.ndarray:
    name = effect.get("effect", "")
    params = effect.get("parameters", {}) or {}
    intensity = float(effect.get("intensity", 0.5))

    try:
        if name == "lowpass_filter":
            cutoff = params.get("frequency_hz", 800 + (1 - intensity) * 3200)
            return lowpass_filter(y, cutoff_hz=cutoff, resonance=intensity)
        elif name == "highpass_filter":
            cutoff = params.get("frequency_hz", 200 + intensity * 1800)
            return highpass_filter(y, cutoff_hz=cutoff)
        elif name == "bass_cut":
            return bass_cut(y, frequency_hz=params.get("frequency_hz", 200.0))
        elif name == "bass_boost":
            return bass_boost(y, frequency_hz=params.get("frequency_hz", 200.0),
                              gain_db=params.get("gain_db", 6.0 * intensity))
        elif name == "reverb_tail":
            return reverb_tail(y, room_size=intensity, decay=params.get("decay", 1.5))
        elif name == "echo_freeze":
            beat_ms = (60.0 / bpm) * 1000
            return echo_freeze(y, beat_duration_ms=beat_ms,
                               repeats=int(params.get("repeats", 4)),
                               decay=params.get("decay", 0.6))
        elif name == "pitch_shift":
            return pitch_shift(y, semitones=params.get("semitones", -2.0 * intensity))
        elif name == "stutter":
            beat_ms = (60.0 / bpm) * 1000
            slice_ms = params.get("slice_ms", beat_ms / 4)
            return stutter(y, slice_ms=slice_ms, repeats=int(params.get("repeats", 8)))
        elif name == "vinyl_brake":
            return vinyl_brake(y, duration_ms=params.get("duration_ms", 2000.0 * intensity))
        elif name == "white_noise_sweep":
            dur_ms = params.get("duration_ms", 2000.0)
            direction = params.get("direction", "up")
            noise = white_noise_sweep(duration_ms=dur_ms, direction=direction)
            # Mix noise over existing audio
            n = min(len(noise), len(y))
            result = y.copy()
            result[-n:] = result[-n:] * (1 - intensity * 0.5) + noise[-n:] * intensity * 0.3
            return result
        elif name == "silence_drop":
            drop = silence_drop(duration_ms=params.get("duration_ms", 500.0))
            return np.concatenate([y, drop]).astype(np.float32)
        elif name == "loop_roll":
            beat_ms = (60.0 / bpm) * 1000
            return loop_roll(y, beat_duration_ms=beat_ms, bars=int(params.get("bars", 4)))
        elif name == "reverse_reverb":
            return reverse_reverb(y, room_size=intensity, decay=params.get("decay", 2.0))
        elif name == "sidechain_pump":
            return sidechain_pump(y, bpm=bpm, intensity=intensity)
        elif name == "filter_sweep":
            return filter_sweep(y,
                                start_hz=params.get("start_hz", 200.0),
                                end_hz=params.get("end_hz", 8000.0),
                                duration_ms=params.get("duration_ms", 4000.0))
        else:
            logger.warning(f"Unknown effect: {name}")
            return y
    except Exception as exc:
        logger.error(f"Effect '{name}' failed: {exc}")
        return y


# ── Bar → seconds helper ──────────────────────────────────────────────────────

def _bar_to_sec(bar: int, bpm: float, beats_per_bar: int = 4) -> float:
    return (bar * beats_per_bar * 60.0) / bpm


# ── Core mixer ────────────────────────────────────────────────────────────────

def execute_transition(
    y_a: np.ndarray,
    y_b: np.ndarray,
    analysis_a: dict,
    analysis_b: dict,
    plan: dict[str, Any],
    progress_cb: Callable[[str], None] | None = None,
) -> np.ndarray:
    """
    Given two audio arrays and a Claude transition plan, produce the mixed output.
    Returns float32 mono array at SR.
    """

    def log(msg: str):
        logger.info(msg)
        if progress_cb:
            progress_cb(msg)

    bpm_strategy = plan.get("bpm_strategy", {})
    bpm_method = bpm_strategy.get("method", "match_a")
    target_bpm = float(bpm_strategy.get("target_bpm", analysis_a["bpm"]))
    bpm_a = float(analysis_a["bpm"])
    bpm_b = float(analysis_b["bpm"])

    # Trim track A from exit point
    exit_sec = float(plan.get("exit_point_track_a_seconds", analysis_a["best_exit_zone"]["start_seconds"]))
    exit_sec = min(exit_sec, len(y_a) / SR)
    y_a = y_a[: int(exit_sec * SR)]

    # Trim track B to entry point
    entry_sec = float(plan.get("entry_point_track_b_seconds", analysis_b["best_entry_zone"]["start_seconds"]))
    entry_sec = min(entry_sec, len(y_b) / SR - 1)
    y_b = y_b[int(entry_sec * SR):]

    # BPM stretch
    if bpm_method == "match_a" or bpm_method == "gradual_shift":
        log(f"Stretching track B from {bpm_b:.1f} → {bpm_a:.1f} BPM")
        y_b = apply_bpm_stretch(y_b, bpm_b, bpm_a)
        working_bpm = bpm_a
    elif bpm_method == "match_b":
        log(f"Stretching track A from {bpm_a:.1f} → {bpm_b:.1f} BPM")
        y_a = apply_bpm_stretch(y_a, bpm_a, bpm_b)
        working_bpm = bpm_b
    elif bpm_method == "double_time":
        working_bpm = bpm_a * 2
        y_b = apply_bpm_stretch(y_b, bpm_b, working_bpm)
    elif bpm_method == "half_time":
        working_bpm = bpm_a / 2
        y_b = apply_bpm_stretch(y_b, bpm_b, working_bpm)
    else:
        working_bpm = target_bpm or bpm_a
        y_a = apply_bpm_stretch(y_a, bpm_a, working_bpm)
        y_b = apply_bpm_stretch(y_b, bpm_b, working_bpm)

    # Apply effects timeline
    effects = plan.get("effects_timeline", [])
    log(f"Applying {len(effects)} effects from AI timeline")

    for eff in sorted(effects, key=lambda e: e.get("bar", 0)):
        bar = int(eff.get("bar", 0))
        dur_bars = int(eff.get("duration_bars", 1))
        target = eff.get("target", "track_a")
        start_sec = _bar_to_sec(bar, working_bpm)
        end_sec = _bar_to_sec(bar + dur_bars, working_bpm)

        log(f"  Effect '{eff.get('effect')}' on {target} @ bar {bar} (intensity={eff.get('intensity', 0.5):.2f})")

        if target in ("track_a", "both"):
            start_s = int(min(start_sec * SR, len(y_a)))
            end_s = int(min(end_sec * SR, len(y_a)))
            if start_s < end_s:
                segment = y_a[start_s:end_s]
                y_a[start_s:end_s] = _apply_effect(segment, eff, working_bpm)[: end_s - start_s]

        if target in ("track_b", "both"):
            start_s = int(min(start_sec * SR, len(y_b)))
            end_s = int(min(end_sec * SR, len(y_b)))
            if start_s < end_s:
                segment = y_b[start_s:end_s]
                y_b[start_s:end_s] = _apply_effect(segment, eff, working_bpm)[: end_s - start_s]

    # Crossfade
    xfade = plan.get("crossfade", {})
    cf_start_bar = int(xfade.get("start_bar", max(0, len(y_a) // SR * working_bpm // 240 - 8)))
    cf_end_bar = int(xfade.get("end_bar", cf_start_bar + 8))
    cf_curve = xfade.get("curve", "linear")
    eq_swap = bool(xfade.get("eq_swap", False))

    cf_start_sec = _bar_to_sec(cf_start_bar, working_bpm)
    cf_end_sec = _bar_to_sec(cf_end_bar, working_bpm)
    cf_duration = max(0.1, cf_end_sec - cf_start_sec)

    log(f"Crossfading with {cf_curve} curve ({cf_duration:.1f}s)")

    if eq_swap:
        # Remove bass from A, add bass to B during crossfade
        cf_start_s = int(min(cf_start_sec * SR, len(y_a)))
        y_a[cf_start_s:] = bass_cut(y_a[cf_start_s:])

    # Build pre-crossfade section of A
    pre_cf = y_a[: int(cf_start_sec * SR)]

    # Crossfade section
    cf_len = int(cf_duration * SR)
    a_cf_start = int(cf_start_sec * SR)
    a_cf = y_a[a_cf_start : a_cf_start + cf_len]

    b_cf_len = min(cf_len, len(y_b))
    b_cf = y_b[:b_cf_len]

    # Pad to same length
    max_cf = max(len(a_cf), len(b_cf))
    if len(a_cf) < max_cf:
        a_cf = np.concatenate([a_cf, np.zeros(max_cf - len(a_cf), dtype=np.float32)])
    if len(b_cf) < max_cf:
        b_cf = np.concatenate([b_cf, np.zeros(max_cf - len(b_cf), dtype=np.float32)])

    fade_out, fade_in = _fade_curves(max_cf, cf_curve)
    cf_mix = (a_cf * fade_out + b_cf * fade_in).astype(np.float32)

    # Post-crossfade tail of B
    post_b = y_b[b_cf_len:]

    result = np.concatenate([pre_cf, cf_mix, post_b]).astype(np.float32)

    # Normalise to -1dB peak
    peak = np.abs(result).max()
    if peak > 0:
        result = result * (0.891 / peak)

    return result


def build_full_mix(
    track_files: list[str],
    analyses: dict[str, dict],
    transitions: list[dict],
    output_path: str,
    progress_cb: Callable[[str], None] | None = None,
) -> str:
    """
    Build a complete mix from all tracks and AI transition plans.
    Returns path to the output MP3.
    """

    def log(msg: str):
        logger.info(msg)
        if progress_cb:
            progress_cb(msg)

    log(f"Loading {len(track_files)} tracks…")
    audios = {}
    for fpath in track_files:
        y, _ = librosa.load(fpath, sr=SR, mono=True)
        audios[fpath] = y.astype(np.float32)

    if len(track_files) == 1:
        mix = audios[track_files[0]]
    else:
        mix = audios[track_files[0]]
        for i in range(len(track_files) - 1):
            f_a = track_files[i]
            f_b = track_files[i + 1]
            plan = transitions[i]
            log(f"\n[Transition {i+1}/{len(track_files)-1}] '{plan.get('transition_name', '?')}' — {plan.get('dj_note', '')}")

            tail = execute_transition(
                mix,
                audios[f_b],
                analyses[f_a],
                analyses[f_b],
                plan,
                progress_cb=progress_cb,
            )
            mix = tail

    # Export to MP3
    log(f"Exporting mix to {output_path}…")
    _export_mp3(mix, output_path)
    log(f"Mix complete: {output_path}")
    return output_path


def _export_mp3(y: np.ndarray, path: str, bitrate: str = "320k") -> None:
    tmp_wav = path.replace(".mp3", "_tmp.wav")
    sf.write(tmp_wav, y, SR, subtype="PCM_16")
    audio_seg = AudioSegment.from_wav(tmp_wav)
    audio_seg.export(path, format="mp3", bitrate=bitrate)
    os.remove(tmp_wav)
