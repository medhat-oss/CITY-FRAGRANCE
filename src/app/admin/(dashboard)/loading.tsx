'use client';

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] w-full bg-transparent select-none animate-fade-in-smooth py-12">
      <div className="flex flex-col items-center justify-center text-center px-4 max-w-sm">
        {/* Polished glowing double-ring spinner matching CRM theme */}
        <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div
            className="w-12 h-12 rounded-full border-2 border-transparent border-t-indigo-400 border-r-indigo-300/60 animate-spin"
            style={{ animationDuration: '0.75s' }}
          />
        </div>

        {/* Text */}
        <p className="text-xs font-semibold text-slate-400 font-heading tracking-[0.2em] uppercase m-0">
          Loading Module...
        </p>
      </div>
    </div>
  );
}
