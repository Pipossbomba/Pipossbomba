import React, { useState, useCallback } from "react";
import UploadZone from "./components/UploadZone";
import TrackCard from "./components/TrackCard";
import SetPlanner from "./components/SetPlanner";
import TransitionCard from "./components/TransitionCard";
import MixGenerator from "./components/MixGenerator";
import MixPlayer from "./components/MixPlayer";
import {
  uploadFiles,
  analyzeTracks,
  planSet,
  designTransitions,
  generateMix,
  regenerateTransition,
  streamMixStatus,
  getMixDownloadUrl,
  TrackAnalysis,
  TransitionPlan,
  SetPlan,
} from "./api";

type Step = "upload" | "analyze" | "plan" | "transitions" | "generate" | "done";

export default function App() {
  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [designingTransitions, setDesigningTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileIds, setFileIds] = useState<string[]>([]);
  const [filenames, setFilenames] = useState<Record<string, string>>({});
  const [analyses, setAnalyses] = useState<Record<string, TrackAnalysis>>({});
  const [setPlan, setSetPlan] = useState<SetPlan | null>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [transitions, setTransitions] = useState<TransitionPlan[]>([]);

  const [mixId, setMixId] = useState<string | null>(null);
  const [mixStatus, setMixStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [mixLogs, setMixLogs] = useState<string[]>([]);
  const [mixProgress, setMixProgress] = useState(0);

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      const ids = uploaded.map(u => u.file_id);
      const names: Record<string, string> = {};
      uploaded.forEach(u => { names[u.file_id] = u.filename || u.file_id; });
      setFileIds(ids);
      setFilenames(names);
      setStep("analyze");
    } catch (e: any) {
      setError(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }, []);

  async function handleAnalyze() {
    setError(null);
    setAnalyzing(true);
    try {
      const result = await analyzeTracks(fileIds);
      setAnalyses(result);
      setOrderedIds(fileIds);
      setStep("plan");
    } catch (e: any) {
      setError(`Analysis failed: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePlanSet() {
    if (fileIds.length < 2) {
      // Skip set planning for single track
      setOrderedIds(fileIds);
      setStep("transitions");
      return;
    }
    setError(null);
    setPlanning(true);
    try {
      const plan = await planSet(fileIds);
      setSetPlan(plan);
      if (plan.ordered_track_ids?.length) setOrderedIds(plan.ordered_track_ids);
    } catch (e: any) {
      setError(`Set planning failed: ${e.message}`);
    } finally {
      setPlanning(false);
    }
  }

  async function handleDesignTransitions() {
    if (orderedIds.length < 2) { setStep("generate"); return; }
    setError(null);
    setDesigningTransitions(true);
    try {
      const t = await designTransitions(orderedIds);
      setTransitions(t);
      setStep("generate");
    } catch (e: any) {
      setError(`Transition design failed: ${e.message}`);
    } finally {
      setDesigningTransitions(false);
    }
  }

  async function handleGenerateMix() {
    setError(null);
    setMixStatus("running");
    setMixLogs([]);
    setMixProgress(5);
    try {
      const id = await generateMix(orderedIds, transitions);
      setMixId(id);
      let logCount = 0;
      streamMixStatus(
        id,
        (log, status) => {
          if (!log.startsWith("STATUS:")) {
            setMixLogs(prev => [...prev, log]);
            logCount++;
            setMixProgress(Math.min(95, 5 + logCount * 3));
          }
        },
        () => { setMixStatus("done"); setMixProgress(100); setStep("done"); },
        () => { setMixStatus("error"); setMixProgress(100); }
      );
    } catch (e: any) {
      setError(`Mix generation failed: ${e.message}`);
      setMixStatus("error");
    }
  }

  async function handleRegenTransition(idx: number) {
    const t = transitions[idx];
    const newT = await regenerateTransition(t.track_a_id, t.track_b_id);
    setTransitions(prev => prev.map((x, i) => i === idx ? newT : x));
  }

  // Build mix player sections (equal division for now)
  const totalDuration = orderedIds.reduce((s, id) => s + (analyses[id]?.duration_seconds || 0), 0);
  let elapsed = 0;
  const trackSections = orderedIds.map((id, i) => {
    const dur = analyses[id]?.duration_seconds || 0;
    const start = elapsed / totalDuration;
    elapsed += dur;
    const end = elapsed / totalDuration;
    return { id, name: filenames[id] || id, startFraction: start, endFraction: end, color: "" };
  });

  const transitionZones = transitions.map((t, i) => ({
    name: t.transition_name,
    startFraction: trackSections[i]?.endFraction - 0.04 || 0,
    endFraction: trackSections[i + 1]?.startFraction + 0.02 || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
              DJ
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AutoDJ AI
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {(["upload", "analyze", "plan", "transitions", "generate", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`text-xs px-2 py-1 rounded-md transition-all
                  ${step === s ? "bg-purple-600 text-white font-medium" :
                    ["upload","analyze","plan","transitions","generate","done"].indexOf(step) > i
                    ? "text-gray-400" : "text-gray-600"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </div>
                {i < 5 && <div className="text-gray-700 mx-1 text-xs">›</div>}
              </div>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                AI-Powered{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  DJ Brain
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Upload your tracks. Claude analyzes each one and invents unique, expressive transitions.
              </p>
            </div>
            <UploadZone onFilesSelected={handleFiles} uploading={uploading} />
          </div>
        )}

        {/* Step: Analyze */}
        {step === "analyze" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white">Uploaded {fileIds.length} Track{fileIds.length !== 1 ? "s" : ""}</h1>
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
              {Object.values(filenames).map((name, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-0">
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-400">{i+1}</div>
                  <span className="text-gray-300 text-sm">{name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-3 rounded-xl font-bold text-white
                bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                disabled:opacity-60 transition-all text-lg shadow-lg shadow-purple-900/40"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Analyzing tracks…
                </span>
              ) : "Analyze All Tracks →"}
            </button>
          </div>
        )}

        {/* Step: Plan */}
        {step === "plan" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white">Track Analysis</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fileIds.map(id => (
                analyses[id] && (
                  <TrackCard
                    key={id}
                    analysis={analyses[id]}
                    filename={filenames[id] || id}
                    isPeak={setPlan?.peak_track_id === id}
                  />
                )
              ))}
            </div>

            {!setPlan && (
              <button
                onClick={handlePlanSet}
                disabled={planning}
                className="w-full py-3 rounded-xl font-bold text-white
                  bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                  disabled:opacity-60 transition-all text-lg shadow-lg shadow-purple-900/40"
              >
                {planning ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> AI is planning your set…
                  </span>
                ) : (fileIds.length < 2 ? "Skip to Transitions →" : "Plan My Set with AI →")}
              </button>
            )}

            {setPlan && (
              <SetPlanner
                plan={setPlan}
                analyses={analyses}
                filenames={filenames}
                orderedIds={orderedIds}
                onReorder={setOrderedIds}
                onAccept={handleDesignTransitions}
              />
            )}

            {designingTransitions && (
              <div className="text-center text-purple-400 flex items-center justify-center gap-2 py-4">
                <Spinner /> Claude is designing your transitions…
              </div>
            )}
          </div>
        )}

        {/* Step: Transitions */}
        {step === "transitions" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white">AI Transition Plans</h1>
            {transitions.length === 0 && (
              <div className="text-gray-400">No transitions (single track set).</div>
            )}
            {transitions.map((t, i) => (
              <TransitionCard
                key={i}
                plan={t}
                trackAName={filenames[t.track_a_id] || t.track_a_id}
                trackBName={filenames[t.track_b_id] || t.track_b_id}
                onRegenerate={() => handleRegenTransition(i)}
              />
            ))}
            <button
              onClick={() => setStep("generate")}
              className="w-full py-3 rounded-xl font-bold text-white
                bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                transition-all text-lg shadow-lg shadow-purple-900/40"
            >
              Generate Mix →
            </button>
          </div>
        )}

        {/* Step: Generate */}
        {(step === "generate" || step === "done") && (
          <div className="space-y-6">
            {step === "generate" && transitions.length > 0 && (
              <div>
                <h1 className="text-3xl font-black text-white mb-4">Transition Plans</h1>
                {transitions.map((t, i) => (
                  <TransitionCard
                    key={i}
                    plan={t}
                    trackAName={filenames[t.track_a_id] || t.track_a_id}
                    trackBName={filenames[t.track_b_id] || t.track_b_id}
                    onRegenerate={() => handleRegenTransition(i)}
                  />
                ))}
              </div>
            )}

            <MixGenerator
              logs={mixLogs}
              status={mixStatus}
              progress={mixProgress}
              mixId={mixId}
              onGenerate={handleGenerateMix}
            />

            {step === "done" && mixId && (
              <MixPlayer
                mixUrl={getMixDownloadUrl(mixId)}
                trackSections={trackSections}
                transitionZones={transitionZones}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 inline" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
