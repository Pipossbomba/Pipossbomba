"""AutoDJ AI — FastAPI backend."""

import asyncio
import json
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Any

import aiofiles
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

load_dotenv()

from ai_dj import design_transition
from analyzer import analyze_track
from mixer import build_full_mix
from setplanner import plan_set

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="AutoDJ AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
MIX_DIR = Path("mixes")
UPLOAD_DIR.mkdir(exist_ok=True)
MIX_DIR.mkdir(exist_ok=True)

# In-memory state (production would use Redis/DB)
_analyses: dict[str, dict] = {}      # file_id → analysis
_set_plan: dict[str, Any] = {}
_transitions: list[dict] = []
_mix_progress: dict[str, list[str]] = {}   # mix_id → log lines
_mix_status: dict[str, str] = {}           # mix_id → "running" | "done" | "error"
_mix_files: dict[str, str] = {}            # mix_id → path


# ── Models ────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    file_ids: list[str]

class PlanSetRequest(BaseModel):
    file_ids: list[str]

class DesignTransitionsRequest(BaseModel):
    ordered_file_ids: list[str]

class GenerateMixRequest(BaseModel):
    ordered_file_ids: list[str]
    transitions: list[dict]


# ── Upload ────────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    result = []
    for file in files:
        file_id = str(uuid.uuid4())
        suffix = Path(file.filename or "track.mp3").suffix or ".mp3"
        dest = UPLOAD_DIR / f"{file_id}{suffix}"
        async with aiofiles.open(dest, "wb") as out:
            content = await file.read()
            await out.write(content)
        result.append({"file_id": file_id, "filename": file.filename, "path": str(dest)})
        logger.info(f"Uploaded: {file.filename} → {dest}")
    return {"files": result}


# ── Analysis ──────────────────────────────────────────────────────────────────

@app.post("/api/analyze")
async def analyze_tracks(req: AnalyzeRequest):
    results = {}
    for file_id in req.file_ids:
        matches = list(UPLOAD_DIR.glob(f"{file_id}.*"))
        if not matches:
            raise HTTPException(404, f"File not found: {file_id}")
        analysis = await asyncio.get_event_loop().run_in_executor(
            None, analyze_track, str(matches[0])
        )
        analysis["file_id"] = file_id
        _analyses[file_id] = analysis
        results[file_id] = analysis
    return {"analyses": results}


# ── Set Planner ───────────────────────────────────────────────────────────────

@app.post("/api/plan-set")
async def plan_set_endpoint(req: PlanSetRequest):
    missing = [fid for fid in req.file_ids if fid not in _analyses]
    if missing:
        raise HTTPException(400, f"Unanalysed tracks: {missing}")

    tracks = [_analyses[fid] for fid in req.file_ids]
    plan = await asyncio.get_event_loop().run_in_executor(None, plan_set, tracks)
    _set_plan.update(plan)
    return plan


# ── Transition Designer ───────────────────────────────────────────────────────

@app.post("/api/design-transitions")
async def design_transitions_endpoint(req: DesignTransitionsRequest):
    missing = [fid for fid in req.ordered_file_ids if fid not in _analyses]
    if missing:
        raise HTTPException(400, f"Unanalysed tracks: {missing}")

    transitions = []
    ids = req.ordered_file_ids
    for i in range(len(ids) - 1):
        a = _analyses[ids[i]]
        b = _analyses[ids[i + 1]]
        t = await asyncio.get_event_loop().run_in_executor(None, design_transition, a, b)
        t["track_a_id"] = ids[i]
        t["track_b_id"] = ids[i + 1]
        transitions.append(t)
        logger.info(f"Transition {i+1}: {json.dumps(t, indent=2)}")

    _transitions.clear()
    _transitions.extend(transitions)
    return {"transitions": transitions}


# ── Mix Generator ─────────────────────────────────────────────────────────────

@app.post("/api/generate-mix")
async def generate_mix_endpoint(req: GenerateMixRequest):
    missing = [fid for fid in req.ordered_file_ids if fid not in _analyses]
    if missing:
        raise HTTPException(400, f"Unanalysed tracks: {missing}")

    mix_id = str(uuid.uuid4())
    _mix_progress[mix_id] = []
    _mix_status[mix_id] = "running"

    async def run_mix():
        try:
            track_files = []
            for fid in req.ordered_file_ids:
                matches = list(UPLOAD_DIR.glob(f"{fid}.*"))
                if not matches:
                    raise FileNotFoundError(f"File {fid} not found")
                track_files.append(str(matches[0]))

            analyses = {fid: _analyses[fid] for fid in req.ordered_file_ids}

            output_path = str(MIX_DIR / f"{mix_id}.mp3")

            def progress(msg: str):
                _mix_progress[mix_id].append(msg)

            await asyncio.get_event_loop().run_in_executor(
                None,
                build_full_mix,
                track_files,
                analyses,
                req.transitions,
                output_path,
                progress,
            )
            _mix_files[mix_id] = output_path
            _mix_status[mix_id] = "done"
        except Exception as exc:
            logger.error(f"Mix generation failed: {exc}")
            _mix_progress[mix_id].append(f"ERROR: {exc}")
            _mix_status[mix_id] = "error"

    asyncio.create_task(run_mix())
    return {"mix_id": mix_id}


# ── SSE Progress Stream ───────────────────────────────────────────────────────

@app.get("/api/mix/{mix_id}/status")
async def mix_status_stream(mix_id: str):
    if mix_id not in _mix_status:
        raise HTTPException(404, "Mix not found")

    async def event_generator():
        sent = 0
        while True:
            logs = _mix_progress.get(mix_id, [])
            while sent < len(logs):
                yield {"data": json.dumps({"log": logs[sent], "status": _mix_status.get(mix_id)})}
                sent += 1
            status = _mix_status.get(mix_id)
            if status in ("done", "error"):
                yield {"data": json.dumps({"log": f"STATUS:{status}", "status": status})}
                break
            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())


# ── Download ──────────────────────────────────────────────────────────────────

@app.get("/api/mix/{mix_id}/download")
async def download_mix(mix_id: str):
    if mix_id not in _mix_files:
        raise HTTPException(404, "Mix not ready")
    path = _mix_files[mix_id]
    if not Path(path).exists():
        raise HTTPException(404, "Mix file missing")
    return FileResponse(path, media_type="audio/mpeg", filename=f"autodj_mix_{mix_id[:8]}.mp3")


# ── Regenerate single transition ──────────────────────────────────────────────

class RegenerateRequest(BaseModel):
    track_a_id: str
    track_b_id: str

@app.post("/api/regenerate-transition")
async def regenerate_transition(req: RegenerateRequest):
    if req.track_a_id not in _analyses or req.track_b_id not in _analyses:
        raise HTTPException(400, "Track not analysed")
    a = _analyses[req.track_a_id]
    b = _analyses[req.track_b_id]
    t = await asyncio.get_event_loop().run_in_executor(None, design_transition, a, b)
    t["track_a_id"] = req.track_a_id
    t["track_b_id"] = req.track_b_id
    logger.info(f"Regenerated transition: {json.dumps(t, indent=2)}")
    return t


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
