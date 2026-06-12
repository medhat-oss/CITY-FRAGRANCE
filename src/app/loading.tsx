export default function RootLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09142E] gap-5">
      <div className="w-11 h-11 rounded-full border-[3px] border-white/10 border-t-[#c5a880] animate-spin" />
      <p className="font-heading text-xs tracking-[0.12em] text-slate-500">Loading…</p>
    </div>
  );
}
