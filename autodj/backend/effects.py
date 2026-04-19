"""Individual audio effects for the AutoDJ transition executor."""

import numpy as np
import librosa
from scipy.signal import butter, sosfilt, sosfiltfilt
from scipy.signal import fftconvolve
import logging

logger = logging.getLogger(__name__)

SR = 22050  # working sample rate


# ── Utility ──────────────────────────────────────────────────────────────────

def _butter_filter(y: np.ndarray, cutoff_hz: float, btype: str, order: int = 4) -> np.ndarray:
    nyq = SR / 2
    cutoff = np.clip(cutoff_hz / nyq, 0.001, 0.999)
    sos = butter(order, cutoff, btype=btype, output="sos")
    return sosfiltfilt(sos, y).astype(np.float32)


def _db_to_linear(db: float) -> float:
    return 10 ** (db / 20)


# ── Filters ───────────────────────────────────────────────────────────────────

def lowpass_filter(y: np.ndarray, cutoff_hz: float = 800.0, resonance: float = 0.7) -> np.ndarray:
    order = max(2, min(8, int(resonance * 8)))
    return _butter_filter(y, cutoff_hz, "low", order)


def highpass_filter(y: np.ndarray, cutoff_hz: float = 200.0) -> np.ndarray:
    return _butter_filter(y, cutoff_hz, "high")


def bass_cut(y: np.ndarray, frequency_hz: float = 200.0) -> np.ndarray:
    return _butter_filter(y, frequency_hz, "high")


def bass_boost(y: np.ndarray, frequency_hz: float = 200.0, gain_db: float = 6.0) -> np.ndarray:
    low = _butter_filter(y, frequency_hz, "low")
    high = _butter_filter(y, frequency_hz, "high")
    gain = _db_to_linear(gain_db)
    return (low * gain + high).astype(np.float32)


def filter_sweep(y: np.ndarray, start_hz: float = 200.0, end_hz: float = 8000.0,
                 duration_ms: float = 4000.0) -> np.ndarray:
    """Sweep a lowpass filter from start_hz to end_hz over duration_ms."""
    n_samples = len(y)
    sweep_samples = min(int(SR * duration_ms / 1000), n_samples)
    result = y.copy()
    chunk = max(1, sweep_samples // 64)

    for i in range(0, sweep_samples, chunk):
        t = i / sweep_samples
        freq = start_hz + (end_hz - start_hz) * t
        freq = np.clip(freq, 20, SR / 2 - 1)
        end_i = min(i + chunk, sweep_samples)
        result[i:end_i] = _butter_filter(y[i:end_i], freq, "low", 2)

    return result.astype(np.float32)


# ── Time / Pitch ──────────────────────────────────────────────────────────────

def pitch_shift(y: np.ndarray, semitones: float = -2.0) -> np.ndarray:
    if semitones == 0:
        return y
    return librosa.effects.pitch_shift(y.astype(np.float32), sr=SR, n_steps=semitones).astype(np.float32)


def apply_bpm_stretch(y: np.ndarray, original_bpm: float, target_bpm: float) -> np.ndarray:
    if original_bpm <= 0 or target_bpm <= 0 or abs(original_bpm - target_bpm) < 0.1:
        return y
    rate = target_bpm / original_bpm
    rate = np.clip(rate, 0.5, 2.0)
    return librosa.effects.time_stretch(y.astype(np.float32), rate=rate).astype(np.float32)


# ── Reverb / Space ────────────────────────────────────────────────────────────

def reverb_tail(y: np.ndarray, room_size: float = 0.5, decay: float = 1.5) -> np.ndarray:
    """Approximation of plate reverb via exponential decay impulse response."""
    decay_samples = int(SR * decay * room_size)
    if decay_samples < 1:
        return y
    t = np.arange(decay_samples) / SR
    ir = np.random.randn(decay_samples).astype(np.float32) * np.exp(-6.0 * t / (decay * room_size + 0.01))
    ir /= np.abs(ir).max() + 1e-9
    wet = fftconvolve(y, ir, mode="full")[: len(y)].astype(np.float32)
    return (0.6 * y + 0.4 * wet).astype(np.float32)


def reverse_reverb(y: np.ndarray, room_size: float = 0.7, decay: float = 2.0) -> np.ndarray:
    y_rev = y[::-1].copy()
    wet_rev = reverb_tail(y_rev, room_size, decay)
    return wet_rev[::-1].astype(np.float32)


# ── Echo / Stutter ────────────────────────────────────────────────────────────

def echo_freeze(y: np.ndarray, beat_duration_ms: float = 500.0, repeats: int = 4,
                decay: float = 0.6) -> np.ndarray:
    """Freeze the last beat and echo it out with decreasing volume."""
    beat_samples = int(SR * beat_duration_ms / 1000)
    beat_samples = max(1, min(beat_samples, len(y)))
    frozen_beat = y[-beat_samples:]
    echoes = [frozen_beat * (decay ** i) for i in range(repeats + 1)]
    tail = np.concatenate(echoes)
    return np.concatenate([y[:-beat_samples], tail]).astype(np.float32)


def stutter(y: np.ndarray, slice_ms: float = 50.0, repeats: int = 8) -> np.ndarray:
    slice_samples = max(1, int(SR * slice_ms / 1000))
    if len(y) < slice_samples:
        return y
    last_slice = y[-slice_samples:]
    stutter_block = np.tile(last_slice, repeats)
    return np.concatenate([y[:-slice_samples], stutter_block]).astype(np.float32)


def loop_roll(y: np.ndarray, beat_duration_ms: float = 500.0, bars: int = 4) -> np.ndarray:
    """Repeat last N beats, each time halving the loop length (DJ loop roll)."""
    total_beats = bars * 4
    beat_samples = max(1, int(SR * beat_duration_ms / 1000))

    segments = []
    current_len = beat_samples * total_beats
    current_len = min(current_len, len(y))
    base = y[-current_len:] if current_len <= len(y) else y

    step_len = current_len
    while step_len >= beat_samples and len(segments) < 8:
        chunk = base[-step_len:][:step_len]
        reps = max(1, current_len // step_len)
        segments.append(np.tile(chunk, reps)[:current_len])
        step_len //= 2

    return np.concatenate([y[:-current_len]] + segments).astype(np.float32) if current_len < len(y) else (
        np.concatenate(segments).astype(np.float32) if segments else y
    )


# ── Special ────────────────────────────────────────────────────────────────────

def vinyl_brake(y: np.ndarray, duration_ms: float = 2000.0) -> np.ndarray:
    """Pitch + speed reduction to a stop, simulating turntable brake."""
    brake_samples = int(SR * duration_ms / 1000)
    brake_samples = min(brake_samples, len(y))
    before = y[:-brake_samples]
    segment = y[-brake_samples:].copy()

    result = []
    n_steps = 32
    chunk = brake_samples // n_steps
    for i in range(n_steps):
        t = (i + 1) / n_steps
        # Pitch drop: up to -8 semitones
        semitones = -8.0 * t
        start = i * chunk
        end = min(start + chunk, brake_samples)
        piece = segment[start:end]
        if len(piece) == 0:
            continue
        shifted = librosa.effects.pitch_shift(piece.astype(np.float32), sr=SR, n_steps=semitones)
        # Slow down (stretch) increasingly
        rate = max(0.1, 1.0 - t * 0.9)
        stretched = librosa.effects.time_stretch(shifted, rate=rate)
        # Keep only original chunk length to avoid drift
        result.append(stretched[: len(piece)].astype(np.float32))

    braked = np.concatenate(result) if result else np.zeros(brake_samples, dtype=np.float32)
    return np.concatenate([before, braked]).astype(np.float32)


def white_noise_sweep(duration_ms: float = 2000.0, direction: str = "up") -> np.ndarray:
    n_samples = int(SR * duration_ms / 1000)
    noise = np.random.randn(n_samples).astype(np.float32) * 0.3
    ramp = np.linspace(0, 1, n_samples) if direction == "up" else np.linspace(1, 0, n_samples)
    start_hz = 200.0 if direction == "up" else 8000.0
    end_hz = 8000.0 if direction == "up" else 200.0
    return filter_sweep(noise * ramp, start_hz, end_hz, duration_ms).astype(np.float32)


def silence_drop(duration_ms: float = 500.0) -> np.ndarray:
    return np.zeros(int(SR * duration_ms / 1000), dtype=np.float32)


def sidechain_pump(y: np.ndarray, bpm: float = 128.0, intensity: float = 0.7) -> np.ndarray:
    """Rhythmic volume ducking on kick beats."""
    beat_samples = int(SR * 60.0 / bpm)
    n_samples = len(y)
    envelope = np.ones(n_samples, dtype=np.float32)

    duck_len = int(beat_samples * 0.3)
    for start in range(0, n_samples, beat_samples):
        end = min(start + duck_len, n_samples)
        t = np.linspace(0, 1, end - start)
        envelope[start:end] = 1.0 - intensity * np.exp(-4.0 * t)

    return (y * envelope).astype(np.float32)
