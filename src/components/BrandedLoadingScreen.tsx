'use client';

interface BrandedLoadingScreenProps {
  title?: string;
  subtitle?: string;
  status?: string;
  fullScreen?: boolean;
}

export default function BrandedLoadingScreen({
  title = 'CITY FRAGRANCE',
  subtitle = 'Point of Sale',
  status = 'Initializing POS Station...',
  fullScreen = true,
}: BrandedLoadingScreenProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center select-none text-white animate-fade-in-smooth'
    : 'flex flex-col items-center justify-center min-h-[65vh] w-full bg-transparent select-none text-white animate-fade-in-smooth py-12';

  const containerStyle = fullScreen
    ? { background: 'linear-gradient(135deg, #0D1B3E 0%, #16234D 50%, #0D1B3E 100%)' }
    : undefined;

  return (
    <div className={containerClasses} style={containerStyle}>
      <div className="flex flex-col items-center justify-center text-center px-4 max-w-sm">
        {/* Brand Header */}
        <h1
          className="font-heading font-semibold text-white tracking-[0.25em] text-lg md:text-xl m-0 mb-1"
          style={{ letterSpacing: '0.25em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xs text-slate-400 font-heading uppercase tracking-[0.3em] m-0 mb-8"
            style={{ letterSpacing: '0.3em' }}
          >
            {subtitle}
          </p>
        )}

        {/* Unified Elegant Spinner */}
        <div className="relative w-12 h-12 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div
            className="w-12 h-12 rounded-full border-2 border-transparent border-t-white border-r-white/50 animate-spin"
            style={{ animationDuration: '0.75s' }}
          />
        </div>

        {/* Status text */}
        {status && (
          <p className="text-xs text-slate-300/80 font-heading tracking-wider m-0">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
