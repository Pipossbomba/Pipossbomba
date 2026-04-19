# AutoDJ AI

An intelligent automatic DJ application where Claude acts as a creative DJ brain — analyzing tracks and inventing unique, expressive transitions between songs.

## Architecture

```
autodj/
├── backend/
│   ├── main.py          FastAPI app + all endpoints
│   ├── analyzer.py      Deep audio analysis (BPM, key, mood, energy curves…)
│   ├── ai_dj.py         Claude API — designs creative transitions
│   ├── setplanner.py    Claude API — plans full set order + narrative
│   ├── mixer.py         Executes AI transition plans into audio
│   ├── effects.py       All DSP effects (15+ types)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx
        ├── api.ts
        └── components/
            ├── UploadZone.tsx
            ├── TrackCard.tsx
            ├── SetPlanner.tsx
            ├── TransitionCard.tsx
            ├── MixGenerator.tsx
            └── MixPlayer.tsx
```

## Setup

### Backend

```bash
cd autodj/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create .env with your Anthropic API key
cp .env.example .env
# Edit .env: ANTHROPIC_API_KEY=sk-ant-...

python main.py
# API runs on http://localhost:8000
```

### Frontend

```bash
cd autodj/frontend
npm install
npm start
# UI runs on http://localhost:3000
```

## How It Works

1. **Upload** — drag and drop audio files (MP3/WAV/FLAC/OGG)
2. **Analyze** — librosa extracts BPM, key, energy curves, mood vectors, beat zones
3. **Plan Set** — Claude reorders tracks for optimal flow and writes a narrative arc
4. **Design Transitions** — Claude invents a unique named transition for every track pair with a full effects timeline
5. **Generate Mix** — the mixer executes the AI plan: BPM stretch, effects, crossfade → single MP3
6. **Listen & Download** — waveform player with color-coded track sections and transition zones

## AI Transition Features

Claude can invent transitions using 15 DSP effects:
`lowpass_filter` · `highpass_filter` · `reverb_tail` · `echo_freeze` · `pitch_shift` · `stutter` · `vinyl_brake` · `white_noise_sweep` · `bass_cut` · `bass_boost` · `silence_drop` · `loop_roll` · `reverse_reverb` · `sidechain_pump` · `filter_sweep`

With 6 crossfade curves: `linear` · `exponential` · `logarithmic` · `s_curve` · `sudden_cut` · `instant`

And 6 BPM strategies: `match_a` · `match_b` · `gradual_shift` · `tempo_drop` · `double_time` · `half_time`

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload audio files |
| POST | `/api/analyze` | Deep audio analysis |
| POST | `/api/plan-set` | AI set order + narrative |
| POST | `/api/design-transitions` | AI transition plans |
| POST | `/api/generate-mix` | Execute mix |
| GET | `/api/mix/{id}/status` | SSE progress stream |
| GET | `/api/mix/{id}/download` | Download MP3 |
| POST | `/api/regenerate-transition` | New AI transition for a pair |
