import React from "react";
import { TrackAnalysis } from "../api";

interface Props {
  analysis: TrackAnalysis;
  filename: string;
  isPeak?: boolean;
}

function MoodBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function MiniWaveform({ curve }: { curve: number[] }) {
  if (!curve.length) return null;
  const max = Math.max(...curve, 0.001);
  const width = 200;
  const height = 40;
  const pts = curve.map((v, i) => {
    const x = (i / (curve.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 mt-2 opacity-70">
      <polyline points={pts.join(" ")} fill="none" stroke="#a855f7" strokeWidth="1.5" />
    </svg>
  );
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TrackCard({ analysis, filename, isPeak }: Props) {
  const { bpm, key, mode, mood_vector, loudness_lufs, danceability, energy_curve, duration_seconds } = analysis;
  return (
    <div className={`rounded-xl border p-4 bg-gray-800/80 backdrop-blur transition-all
      ${isPeak ? "border-yellow-500/60 shadow-yellow-500/20 shadow-lg" : "border-gray-700"}`}>

      {isPeak && (
        <div className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
          <span>⚡</span> Peak Track
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-white text-sm truncate max-w-[180px]" title={filename}>
            {filename.replace(/\.[^.]+$/, "")}
          </h3>
          <span className="text-xs text-gray-500">{fmt(duration_seconds)}</span>
        </div>
        <div className="text-right">
          <div className="text-purple-400 font-bold text-lg leading-none">{bpm.toFixed(1)}</div>
          <div className="text-xs text-gray-500">BPM</div>
        </div>
      </div>

      <div className="flex gap-3 mb-3">
        <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
          {key} {mode}
        </span>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
          {loudness_lufs.toFixed(1)} LUFS
        </span>
        <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
          {(danceability * 100).toFixed(0)}% dance
        </span>
      </div>

      <div className="space-y-2">
        <MoodBar label="Energy"     value={mood_vector.energy}     color="bg-orange-500" />
        <MoodBar label="Tension"    value={mood_vector.tension}    color="bg-red-500" />
        <MoodBar label="Brightness" value={mood_vector.brightness} color="bg-yellow-400" />
        <MoodBar label="Groove"     value={mood_vector.groove}     color="bg-green-500" />
      </div>

      <MiniWaveform curve={energy_curve} />
    </div>
  );
}
