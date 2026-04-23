export default function Loading() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center gap-1.5 justify-center mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-midnight/30">
          Living Azores
        </p>
      </div>
    </div>
  )
}
