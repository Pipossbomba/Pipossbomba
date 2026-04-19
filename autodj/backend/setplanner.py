"""Set-level AI planning — Claude reorders the playlist and narrates the set arc."""

import json
import logging
import os
from typing import Any

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """\
You are a world-class DJ and musical curator. You see music as a journey — \
every set tells a story, from opening ambience through tension and peak energy \
to an emotional denouement. You have a rare ability to sense how tracks connect \
emotionally, rhythmically, and harmonically across an entire set.

You will receive the analysis of multiple tracks. Your job is to order them for \
maximum impact, identify the peak moment, and narrate the full story of the set.

You must respond ONLY with a valid JSON object.\
"""

USER_TEMPLATE = """\
Here are {n} tracks with their full audio analyses:

{tracks_json}

Design the optimal set order for these tracks. Respond with this JSON:
{{
  "ordered_track_ids": [<list of file_id strings in your suggested order>],
  "peak_track_id": "<file_id of the most energetic peak track>",
  "narrative": {{
    "opening": "<1-2 sentences about the opening mood>",
    "building": "<1-2 sentences about the build>",
    "peak": "<1-2 sentences about the peak>",
    "comedown": "<1-2 sentences about the comedown>",
    "closing": "<1-2 sentences about the close>"
  }},
  "energy_arc_description": "<2-3 sentences about the overall energy journey>",
  "jarring_tracks": [
    {{
      "file_id": "<id>",
      "reason": "<why it clashes>",
      "placement_suggestion": "<where it works best and why>"
    }}
  ],
  "dj_set_note": "<3-5 sentences of overall artistic reasoning for this set>"
}}\
"""


def _trim_analysis(analysis: dict) -> dict:
    """Reduce large arrays for the set-planning prompt."""
    trimmed = dict(analysis)
    for key in ("energy_curve", "spectral_centroid_curve"):
        if key in trimmed and isinstance(trimmed[key], list):
            curve = trimmed[key]
            step = max(1, len(curve) // 20)
            trimmed[key] = [round(curve[i], 4) for i in range(0, len(curve), step)][:20]
    trimmed.pop("file_path", None)
    trimmed.pop("sample_rate", None)
    return trimmed


def plan_set(tracks: list[dict[str, Any]]) -> dict[str, Any]:
    """
    tracks: list of dicts, each with a 'file_id' key plus full analysis fields.
    Returns Claude's set plan.
    """
    trimmed_tracks = {}
    for t in tracks:
        fid = t.get("file_id", t.get("file_path", str(id(t))))
        trimmed_tracks[fid] = _trim_analysis(t)

    tracks_json = json.dumps(trimmed_tracks, indent=2)
    user_msg = USER_TEMPLATE.format(n=len(tracks), tracks_json=tracks_json)

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = response.content[0].text.strip()
    logger.info(f"Claude set plan response:\n{raw}")

    # Strip markdown code fences
    if "```" in raw:
        start = raw.find("```")
        end = raw.rfind("```")
        raw = raw[start + 3 : end]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        plan = json.loads(raw.strip())
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning(f"Set plan JSON parse error: {exc}. Retrying…")
        fix_resp = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_msg},
                {"role": "assistant", "content": raw},
                {
                    "role": "user",
                    "content": "Your response contained invalid JSON. Return ONLY a valid JSON object.",
                },
            ],
        )
        raw2 = fix_resp.content[0].text.strip()
        if "```" in raw2:
            s = raw2.find("```"); e = raw2.rfind("```")
            raw2 = raw2[s + 3: e]
            if raw2.startswith("json"):
                raw2 = raw2[4:]
        plan = json.loads(raw2.strip())

    logger.info(
        f"[Set Plan] Peak: {plan.get('peak_track_id')} | "
        f"Order: {plan.get('ordered_track_ids')}"
    )
    return plan
