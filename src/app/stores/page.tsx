import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function StoresPage() {
  return (
    <div className="bg-[#09142E] text-white min-h-screen">
      <Header />
      <main className="flex flex-col items-center justify-center px-4 py-32">
        <div
          className="w-full max-w-xl mx-auto bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-10 md:p-14 text-center animate-fade-up"
        >
          <p className="font-heading text-xs tracking-[0.3em] uppercase text-white/50 mb-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            CITY FRAGRANCE
          </p>

          <h1 className="font-heading text-4xl sm:text-5xl font-light text-white tracking-widest mb-8 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            OUR STORE
          </h1>

          <h2 className="font-heading text-xl font-normal text-white mb-2 animate-fade-up" style={{ animationDelay: '0.35s' }}>
            City Fragrance
          </h2>

          <p className="font-body text-white/70 text-sm mb-1 animate-fade-up" style={{ animationDelay: '0.45s' }}>
            Main Branch, Cairo, Egypt
          </p>

          <p className="font-body text-white/70 text-sm mb-1 animate-fade-up" style={{ animationDelay: '0.55s' }}>
            Phone: +20 10 0444 1598
          </p>

          <p className="font-body text-white/70 text-sm mb-10 animate-fade-up" style={{ animationDelay: '0.65s' }}>
            Hours: Everyday: 10:00 AM – 10:00 PM
          </p>

          <div className="animate-fade-up" style={{ animationDelay: '0.75s' }}>
            <a
              href="https://maps.app.goo.gl/cKe1LUbsALMnyu9U8?g_st=aw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full font-heading text-sm font-semibold tracking-[0.15em] uppercase px-8 py-4 rounded-xl border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all duration-300 no-underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              GET DIRECTIONS
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
