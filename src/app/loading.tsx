export default function RootLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#111B3D] gap-5">
      <div className="w-11 h-11 rounded-full border-[3px] border-white/10 border-t-white animate-spin" />
      <p className="font-heading text-xs tracking-[0.12em] text-white/50">Loading…</p>
    </div>
  );
}
