"""AI Creative Brain — calls Claude to design unique transitions between track pairs."""

import json
import logging
import os
from typing import Any

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are an elite music producer and DJ with 20 years of experience across \
house, techno, hip-hop, drum & bass, ambient, and pop. You have perfect \
musical ear, deep knowledge of music theory, and a gift for creating \
transitions that feel surprising yet inevitable.

You will receive detailed audio analysis of two tracks. Your job is to \
design a unique, creative transition plan between them. Be bold. Invent \
transitions that have never been heard before if the music calls for it. \
Think about the emotional journey of the listener.

You must respond ONLY with a valid JSON object — no explanation outside the JSON.\
"""

USER_TEMPLATE = """\
Design a creative DJ transition between these two tracks:

TRACK A (outgoing): {track_a}

TRACK B (incoming): {track_b}

Respond with this JSON structure:
{{
  "transition_name": "a creative name you invent for this transition",
  "dj_note": "2-3 sentences explaining your artistic reasoning — what story are you telling?",
  "total_duration_bars": <integer 4-64>,
  "bpm_strategy": {{
    "method": "match_a" | "match_b" | "gradual_shift" | "tempo_drop" | "double_time" | "half_time",
    "target_bpm": <float>,
    "shift_start_bar": <int>,
    "shift_end_bar": <int>
  }},
  "effects_timeline": [
    {{
      "bar": <int — when this effect starts>,
      "duration_bars": <int>,
      "effect": "lowpass_filter" | "highpass_filter" | "reverb_tail" | "echo_freeze" |
                 "pitch_shift" | "stutter" | "vinyl_brake" | "white_noise_sweep" |
                 "bass_cut" | "bass_boost" | "silence_drop" | "loop_roll" |
                 "reverse_reverb" | "sidechain_pump" | "filter_sweep",
      "target": "track_a" | "track_b" | "both",
      "intensity": <float 0.0-1.0>,
      "parameters": {{ <any extra params like "semitones": -2, "frequency_hz": 800> }}
    }}
  ],
  "crossfade": {{
    "start_bar": <int>,
    "end_bar": <int>,
    "curve": "linear" | "exponential" | "logarithmic" | "s_curve" | "sudden_cut" | "instant",
    "eq_swap": true | false
  }},
  "entry_point_track_b_seconds": <float — where in track B to start playing>,
  "exit_point_track_a_seconds": <float — where in track A to stop>,
  "energy_arc": "smooth" | "drop_then_rise" | "build_to_peak" | "tension_release" | "surprise"
}}

Be creative. Invent unexpected transitions. Use the mood vectors and energy \
curves to make emotional decisions, not just technical ones. If the tracks \
clash badly, that can be a creative opportunity — a dramatic break.\
"""


def _call_claude(messages: list[dict], system: str) -> str:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=system,
        messages=messages,
    )
    return response.content[0].text.strip()


def _parse_json_response(text: str) -> dict:
    """Extract and parse JSON from a Claude response."""
    # Strip markdown code blocks if present
    if "```" in text:
        start = text.find("```")
        end = text.rfind("```")
        text = text[start + 3 : end]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


def design_transition(track_a: dict[str, Any], track_b: dict[str, Any]) -> dict[str, Any]:
    """Ask Claude to design a creative transition between two analysed tracks."""
    # Trim large arrays to keep prompt size reasonable
    def trim(analysis: dict) -> dict:
        trimmed = dict(analysis)
        for key in ("energy_curve", "spectral_centroid_curve"):
            if key in trimmed and isinstance(trimmed[key], list):
                curve = trimmed[key]
                # Sample at most 60 points
                if len(curve) > 60:
                    step = len(curve) // 60
                    trimmed[key] = [round(curve[i], 4) for i in range(0, len(curve), step)][:60]
        trimmed.pop("file_path", None)
        trimmed.pop("sample_rate", None)
        return trimmed

    user_message = USER_TEMPLATE.format(
        track_a=json.dumps(trim(track_a), indent=2),
        track_b=json.dumps(trim(track_b), indent=2),
    )

    messages = [{"role": "user", "content": user_message}]

    raw = _call_claude(messages, SYSTEM_PROMPT)
    logger.info(f"Claude transition response:\n{raw}")

    try:
        plan = _parse_json_response(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning(f"Invalid JSON from Claude: {exc}. Retrying…")
        fix_messages = messages + [
            {"role": "assistant", "content": raw},
            {
                "role": "user",
                "content": (
                    "Your previous response contained invalid JSON. "
                    "Please return ONLY a valid JSON object with no surrounding text."
                ),
            },
        ]
        raw2 = _call_claude(fix_messages, SYSTEM_PROMPT)
        logger.info(f"Claude retry response:\n{raw2}")
        plan = _parse_json_response(raw2)

    logger.info(
        f"[AI Transition] '{plan.get('transition_name', '?')}' | "
        f"arc={plan.get('energy_arc')} | "
        f"effects={len(plan.get('effects_timeline', []))}"
    )
    return plan
