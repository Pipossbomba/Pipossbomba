const BASE = "http://localhost:8000/api";

export interface TrackAnalysis {
  file_id: string;
  duration_seconds: number;
  bpm: number;
  key: string;
  mode: string;
  energy_curve: number[];
  spectral_centroid_curve: number[];
  danceability: number;
  mood_vector: { energy: number; tension: number; brightness: number; groove: number };
  loudness_lufs: number;
  tempo_stability: number;
  best_exit_zone: { start_seconds: number; end_seconds: number };
  best_entry_zone: { start_seconds: number; end_seconds: number };
  energy_events: { drops: number[]; buildups: number[]; breakdowns: any[] };
  silence: { start_seconds: number; end_seconds: number };
  beat_count: number;
}

export interface EffectEntry {
  bar: number;
  duration_bars: number;
  effect: string;
  target: string;
  intensity: number;
  parameters: Record<string, any>;
}

export interface TransitionPlan {
  transition_name: string;
  dj_note: string;
  total_duration_bars: number;
  bpm_strategy: { method: string; target_bpm: number; shift_start_bar: number; shift_end_bar: number };
  effects_timeline: EffectEntry[];
  crossfade: { start_bar: number; end_bar: number; curve: string; eq_swap: boolean };
  entry_point_track_b_seconds: number;
  exit_point_track_a_seconds: number;
  energy_arc: string;
  track_a_id: string;
  track_b_id: string;
}

export interface SetPlan {
  ordered_track_ids: string[];
  peak_track_id: string;
  narrative: { opening: string; building: string; peak: string; comedown: string; closing: string };
  energy_arc_description: string;
  jarring_tracks: any[];
  dj_set_note: string;
}

export async function uploadFiles(files: File[]): Promise<{ file_id: string; filename: string }[]> {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  const r = await fetch(`${BASE}/upload`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.files;
}

export async function analyzeTracks(fileIds: string[]): Promise<Record<string, TrackAnalysis>> {
  const r = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds }),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.analyses;
}

export async function planSet(fileIds: string[]): Promise<SetPlan> {
  const r = await fetch(`${BASE}/plan-set`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function designTransitions(orderedFileIds: string[]): Promise<TransitionPlan[]> {
  const r = await fetch(`${BASE}/design-transitions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_file_ids: orderedFileIds }),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.transitions;
}

export async function generateMix(orderedFileIds: string[], transitions: TransitionPlan[]): Promise<string> {
  const r = await fetch(`${BASE}/generate-mix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_file_ids: orderedFileIds, transitions }),
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return data.mix_id;
}

export async function regenerateTransition(
  trackAId: string,
  trackBId: string
): Promise<TransitionPlan> {
  const r = await fetch(`${BASE}/regenerate-transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_a_id: trackAId, track_b_id: trackBId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function streamMixStatus(
  mixId: string,
  onLog: (log: string, status: string) => void,
  onDone: () => void,
  onError: () => void
): () => void {
  const es = new EventSource(`${BASE}/mix/${mixId}/status`);
  es.onmessage = (e) => {
    const { log, status } = JSON.parse(e.data);
    onLog(log, status);
    if (status === "done") { onDone(); es.close(); }
    if (status === "error") { onError(); es.close(); }
  };
  es.onerror = () => { onError(); es.close(); };
  return () => es.close();
}

export function getMixDownloadUrl(mixId: string): string {
  return `${BASE}/mix/${mixId}/download`;
}
