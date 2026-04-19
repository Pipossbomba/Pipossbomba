import React, { useCallback, useState } from "react";

interface Props {
  onFilesSelected: (files: File[]) => void;
  uploading: boolean;
}

export default function UploadZone({ onFilesSelected, uploading }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("audio/") || /\.(mp3|wav|flac|ogg|aiff|m4a)$/i.test(f.name)
      );
      if (files.length) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer
        ${dragging ? "border-purple-400 bg-purple-950/40 scale-[1.01]" : "border-gray-600 hover:border-purple-500 hover:bg-gray-800/60"}
        ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFilesSelected(files);
        }}
      />

      <div className="text-6xl mb-4">🎵</div>
      <h2 className="text-2xl font-bold text-white mb-2">
        {dragging ? "Drop your tracks here" : "Drag & drop audio files"}
      </h2>
      <p className="text-gray-400 text-sm">
        MP3, WAV, FLAC, OGG, AIFF, M4A — drop multiple tracks to build a set
      </p>
      {uploading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-purple-400">
          <Spinner />
          <span>Uploading…</span>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
