export default function ProductLoading() {
  return (
    <div className="bg-[#09142E] min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <span className="text-white/40 text-xs font-heading tracking-widest uppercase">Loading</span>
      </div>
    </div>
  );
}
