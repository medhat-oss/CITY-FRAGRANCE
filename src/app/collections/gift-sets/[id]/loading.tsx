export default function GiftSetLoading() {
  return (
    <div className="bg-[#070B13] min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-white/40 text-xs font-heading tracking-widest uppercase">Loading</span>
      </div>
    </div>
  );
}
