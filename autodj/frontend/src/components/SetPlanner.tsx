import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { SetPlan, TrackAnalysis } from "../api";

interface Props {
  plan: SetPlan;
  analyses: Record<string, TrackAnalysis>;
  filenames: Record<string, string>;
  orderedIds: string[];
  onReorder: (ids: string[]) => void;
  onAccept: () => void;
}

export default function SetPlanner({ plan, analyses, filenames, orderedIds, onReorder, onAccept }: Props) {
  const energyData = orderedIds.map((id, i) => ({
    name: (filenames[id] || id).replace(/\.[^.]+$/, "").slice(0, 14),
    energy: analyses[id] ? Math.round(analyses[id].mood_vector.energy * 100) : 0,
    bpm: analyses[id] ? analyses[id].bpm : 0,
  }));

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...orderedIds];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  }

  function moveDown(idx: number) {
    if (idx === orderedIds.length - 1) return;
    const next = [...orderedIds];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorder(next);
  }

  const sections: [keyof typeof plan.narrative, string][] = [
    ["opening", "Opening"],
    ["building", "Building"],
    ["peak", "Peak"],
    ["comedown", "Comedown"],
    ["closing", "Closing"],
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">AI Set Narrative</h2>
        <p className="text-gray-400 text-sm mb-4 italic">{plan.dj_set_note}</p>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {sections.map(([key, label]) => (
            <div key={key} className="bg-gray-900 rounded-lg p-3">
              <div className="text-xs font-semibold text-purple-400 mb-1">{label}</div>
              <p className="text-xs text-gray-300 leading-relaxed">{plan.narrative[key]}</p>
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-400 mb-2">{plan.energy_arc_description}</div>
      </div>

      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Energy Arc</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Line type="monotone" dataKey="energy" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Track Order — drag to reorder</h3>
        <div className="space-y-2">
          {orderedIds.map((id, idx) => (
            <div key={id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                ${id === plan.peak_track_id ? "border-yellow-500/50 bg-yellow-900/20" : "border-gray-700 bg-gray-900/50"}`}
            >
              <span className="text-gray-500 text-sm w-5 text-center">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-medium truncate block">
                  {(filenames[id] || id).replace(/\.[^.]+$/, "")}
                </span>
                {analyses[id] && (
                  <span className="text-xs text-gray-500">
                    {analyses[id].bpm.toFixed(1)} BPM · {analyses[id].key} {analyses[id].mode}
                  </span>
                )}
              </div>
              {id === plan.peak_track_id && <span className="text-xs text-yellow-400 font-semibold">⚡ Peak</span>}
              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                >▲</button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === orderedIds.length - 1}
                  className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30"
                >▼</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {plan.jarring_tracks?.length > 0 && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2">⚠ Jarring Tracks</h3>
          {plan.jarring_tracks.map((jt: any, i: number) => (
            <div key={i} className="text-xs text-gray-300 mb-1">
              <span className="font-medium text-white">{filenames[jt.file_id] || jt.file_id}</span>
              {" — "}{jt.reason}. {jt.placement_suggestion}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onAccept}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600
          hover:from-purple-500 hover:to-pink-500 transition-all text-lg shadow-lg shadow-purple-900/40"
      >
        Design Transitions with AI →
      </button>
    </div>
  );
}
