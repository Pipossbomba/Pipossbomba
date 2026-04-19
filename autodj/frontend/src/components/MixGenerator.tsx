import React, { useEffect, useRef } from "react";

interface Props {
  logs: string[];
  status: "idle" | "running" | "done" | "error";
  progress: number;
  mixId: string | null;
  onGenerate: () => void;
}

export default function MixGenerator({ logs, status, progress, mixId, onGenerate }: Props) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Mix Generator</h2>
        {status === "idle" && (
          <button
            onClick={onGenerate}
            className="px-6 py-2.5 rounded-xl font-bold text-white
              bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
              transition-all shadow-lg shadow-purple-900/40"
          >
            Generate Mix
          </button>
        )}
        {status === "done" && mixId && (
          <a
            href={`http://localhost:8000/api/mix/${mixId}/download`}
            className="px-6 py-2.5 rounded-xl font-bold text-white
              bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 transition-all"
          >
            Download MP3
          </a>
        )}
      </div>

      {status !== "idle" && (
        <>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${status === "done" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-purple-500 animate-pulse"}`}
              style={{ width: `${status === "done" ? 100 : status === "error" ? 100 : Math.max(5, progress)}%` }}
            />
          </div>

          <div
            ref={logRef}
            className="bg-gray-950 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs space-y-1 border border-gray-800"
          >
            {logs.map((line, i) => (
              <div key={i} className={`
                ${line.startsWith("ERROR") ? "text-red-400" :
                  line.includes("Transition") ? "text-purple-300 font-semibold" :
                  line.includes("Applying") || line.includes("Effect") ? "text-blue-300" :
                  line.includes("complete") || line.includes("done") ? "text-green-400" :
                  "text-gray-400"}
              `}>
                {line.startsWith("  ") ? (
                  <span><span className="text-gray-600">  │ </span>{line.trim()}</span>
                ) : line}
              </div>
            ))}
            {status === "running" && (
              <div className="text-purple-400 animate-pulse">▌</div>
            )}
          </div>

          {status === "done" && (
            <div className="text-center text-green-400 font-semibold text-sm">
              ✓ Mix generated successfully!
            </div>
          )}
          {status === "error" && (
            <div className="text-center text-red-400 font-semibold text-sm">
              Mix generation failed. Check logs above.
            </div>
          )}
        </>
      )}
    </div>
  );
}
