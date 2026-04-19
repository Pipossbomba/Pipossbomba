import React, { useEffect, useRef, useState } from "react";

interface TrackSection {
  id: string;
  name: string;
  startFraction: number;
  endFraction: number;
  color: string;
}

interface TransitionZone {
  name: string;
  startFraction: number;
  endFraction: number;
}

interface Props {
  mixUrl: string;
  trackSections: TrackSection[];
  transitionZones: TransitionZone[];
}

const TRACK_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#dc2626", "#7c3aed", "#0891b2", "#65a30d",
];

export default function MixPlayer({ mixUrl, trackSections, transitionZones }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    audio.currentTime = frac * duration;
  }

  function fmt(s: number): string {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const playFrac = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">Mix Player</h2>

      <audio ref={audioRef} src={mixUrl} />

      {/* Waveform / timeline */}
      <div
        className="relative h-16 bg-gray-900 rounded-xl overflow-hidden cursor-pointer border border-gray-700"
        onClick={seek}
      >
        {/* Track sections */}
        {trackSections.map((sec, i) => (
          <div
            key={sec.id}
            title={sec.name}
            className="absolute top-0 h-full opacity-30"
            style={{
              left: `${sec.startFraction * 100}%`,
              width: `${(sec.endFraction - sec.startFraction) * 100}%`,
              backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length],
            }}
          />
        ))}

        {/* Transition zones */}
        {transitionZones.map((tz, i) => (
          <div
            key={i}
            title={`Transition: ${tz.name}`}
            className="absolute top-0 h-full border-l border-r border-purple-400/60 bg-purple-500/20"
            style={{
              left: `${tz.startFraction * 100}%`,
              width: `${(tz.endFraction - tz.startFraction) * 100}%`,
            }}
          />
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white z-10 pointer-events-none"
          style={{ left: `${playFrac * 100}%` }}
        />

        {/* Track names */}
        {trackSections.map((sec, i) => (
          <div
            key={sec.id + "-label"}
            className="absolute top-1 text-[10px] text-white/80 font-medium px-1 truncate pointer-events-none"
            style={{
              left: `${sec.startFraction * 100}%`,
              width: `${(sec.endFraction - sec.startFraction) * 100}%`,
            }}
          >
            {sec.name.replace(/\.[^.]+$/, "").slice(0, 12)}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 transition-all
            flex items-center justify-center text-white text-xl shadow-lg shadow-purple-900/40"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <div className="flex-1 text-sm text-gray-400">
          <span className="text-white font-mono">{fmt(currentTime)}</span>
          <span className="mx-1">/</span>
          <span className="font-mono">{fmt(duration)}</span>
        </div>
      </div>

      {/* Track legend */}
      {trackSections.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {trackSections.map((sec, i) => (
            <div key={sec.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length] }}
              />
              <span className="text-xs text-gray-400">{sec.name.replace(/\.[^.]+$/, "").slice(0, 20)}</span>
            </div>
          ))}
        </div>
      )}

      {transitionZones.length > 0 && (
        <div className="text-xs text-gray-500">
          Purple zones = AI transitions:{" "}
          {transitionZones.map(z => `"${z.name}"`).join(", ")}
        </div>
      )}
    </div>
  );
}
