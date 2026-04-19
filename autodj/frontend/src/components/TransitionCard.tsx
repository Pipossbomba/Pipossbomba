import React, { useState } from "react";
import { TransitionPlan, EffectEntry } from "../api";

interface Props {
  plan: TransitionPlan;
  trackAName: string;
  trackBName: string;
  onRegenerate: () => Promise<void>;
}

const ARC_COLORS: Record<string, string> = {
  smooth: "text-green-400",
  drop_then_rise: "text-blue-400",
  build_to_peak: "text-orange-400",
  tension_release: "text-red-400",
  surprise: "text-pink-400",
};

const EFFECT_COLORS: Record<string, string> = {
  lowpass_filter: "#818cf8",
  highpass_filter: "#34d399",
  reverb_tail: "#60a5fa",
  echo_freeze: "#a78bfa",
  pitch_shift: "#f472b6",
  stutter: "#fb923c",
  vinyl_brake: "#fbbf24",
  white_noise_sweep: "#e5e7eb",
  bass_cut: "#f87171",
  bass_boost: "#4ade80",
  silence_drop: "#6b7280",
  loop_roll: "#c084fc",
  reverse_reverb: "#22d3ee",
  sidechain_pump: "#f97316",
  filter_sweep: "#84cc16",
};

function EffectsTimeline({ effects, totalBars }: { effects: EffectEntry[]; totalBars: number }) {
  if (!effects.length) return <div className="text-xs text-gray-500 italic">No effects</div>;

  return (
    <div className="relative h-10 bg-gray-900 rounded-lg overflow-hidden">
      {effects.map((eff, i) => {
        const left = ((eff.bar || 0) / totalBars) * 100;
        const width = Math.max(1, ((eff.duration_bars || 1) / totalBars) * 100);
        const color = EFFECT_COLORS[eff.effect] || "#9ca3af";
        return (
          <div
            key={i}
            title={`${eff.effect} (${eff.target}) @ bar ${eff.bar}, intensity ${eff.intensity?.toFixed(2)}`}
            className="absolute top-1 h-8 rounded opacity-80 flex items-center justify-center overflow-hidden"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              minWidth: 4,
              backgroundColor: color + "55",
              borderLeft: `3px solid ${color}`,
            }}
          >
            <span className="text-[9px] text-white font-medium px-1 truncate">
              {eff.effect.replace(/_/g, " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function TransitionCard({ plan, trackAName, trackBName, onRegenerate }: Props) {
  const [regen, setRegen] = useState(false);

  async function handleRegen() {
    setRegen(true);
    try { await onRegenerate(); } finally { setRegen(false); }
  }

  const arcColor = ARC_COLORS[plan.energy_arc] || "text-purple-400";

  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">
            <span className="text-gray-300">{trackAName.replace(/\.[^.]+$/, "")}</span>
            {" → "}
            <span className="text-gray-300">{trackBName.replace(/\.[^.]+$/, "")}</span>
          </div>
          <h3 className="text-lg font-bold text-white">"{plan.transition_name}"</h3>
        </div>
        <button
          onClick={handleRegen}
          disabled={regen}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/50
            text-purple-300 hover:bg-purple-900/40 transition-all disabled:opacity-50"
        >
          {regen ? "…" : "↻ Regenerate"}
        </button>
      </div>

      <p className="text-sm text-gray-400 italic leading-relaxed">{plan.dj_note}</p>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge label="Arc" value={plan.energy_arc?.replace(/_/g, " ")} color={arcColor} />
        <Badge label="Bars" value={String(plan.total_duration_bars)} color="text-gray-300" />
        <Badge label="BPM" value={`${plan.bpm_strategy?.method} → ${plan.bpm_strategy?.target_bpm?.toFixed(1)}`} color="text-blue-300" />
        <Badge label="Fade" value={plan.crossfade?.curve} color="text-pink-300" />
        {plan.crossfade?.eq_swap && <Badge label="EQ Swap" value="on" color="text-orange-300" />}
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-1 font-medium">Effects Timeline ({plan.total_duration_bars} bars)</div>
        <EffectsTimeline effects={plan.effects_timeline} totalBars={plan.total_duration_bars} />
        <div className="flex gap-3 mt-2 flex-wrap">
          {[...new Set((plan.effects_timeline || []).map(e => e.effect))].map(name => (
            <div key={name} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EFFECT_COLORS[name] || "#9ca3af" }} />
              <span className="text-[10px] text-gray-500">{name.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="bg-gray-900 px-2 py-1 rounded-full text-gray-500">
      {label}: <span className={`font-medium ${color}`}>{value}</span>
    </span>
  );
}
