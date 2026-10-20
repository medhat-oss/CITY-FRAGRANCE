export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] min-h-screen w-screen flex flex-col items-center justify-center bg-[#09142E] px-4 overflow-hidden select-none pointer-events-auto">
      {/* Center: Logo Video */}
      <div className="flex flex-col items-center justify-center">
        <video
          src="/logo-animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          suppressHydrationWarning
          className="w-20 h-20 md:w-24 md:h-24 object-contain"
          aria-label="City Fragrance Loading"
        />
      </div>

      {/* Bottom: Machine Code Footer */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex flex-col items-center justify-center text-slate-400 text-xs space-y-1.5 text-center px-4">
        <p>© 2026 Machine Code — All Rights Reserved</p>
        <p>Software Solutions for Business Management & Operations - ERP - POS - Custom Systems</p>
        <p className="mt-2 text-slate-300">Eng. Medhat Elaraby — Founder & Software Engineer</p>
      </div>
    </div>
  );
}
