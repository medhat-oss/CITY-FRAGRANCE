'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const STORES = [
  {
    name: 'City Fragrance — Cairo',
    address: '68 Nile Corniche, Downtown, Cairo Governorate',
    phone: '+20 10 0444 1598',
    hours: 'Sat–Thu: 10:00 AM – 10:00 PM | Fri: 2:00 PM – 10:00 PM',
  },
  {
    name: 'City Fragrance — Alexandria',
    address: '14 Saad Zaghloul St, Raml Station, Alexandria',
    phone: '+20 10 0444 1598',
    hours: 'Sat–Thu: 10:00 AM – 10:00 PM | Fri: 2:00 PM – 10:00 PM',
  },
];

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function StoresPage() {
  return (
    <div className="bg-[#09142E] text-white min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#09142E]/60 via-[#09142E]/80 to-[#09142E]" />
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <p className="text-white/60 font-heading text-sm tracking-[0.3em] uppercase mb-6 animate-fade-up">
              City Fragrance
            </p>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-6 animate-fade-up">
              STORE LOCATOR
            </h1>
            <div className="w-16 h-px bg-white/20 mx-auto animate-fade-up" />
          </div>
        </section>

        {/* Store Cards */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {STORES.map((store, i) => (
              <FadeInSection key={store.name} delay={i * 150}>
                <div className="group relative h-full border border-white/10 rounded-2xl p-8 bg-white/[0.03] transition-all duration-500 ease-in-out hover:border-white/40 hover:bg-white/[0.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.06)]">
                  <div className="text-white/60 text-2xl mb-4 tracking-widest font-heading">
                    {store.name}
                  </div>
                  <div className="space-y-3 font-body text-white/70">
                    <p className="flex items-start gap-3">
                      <span className="text-white/60 mt-0.5 shrink-0">&#9906;</span>
                      <span>{store.address}</span>
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-white/60 shrink-0">&#9742;</span>
                      <a href={`tel:${store.phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors no-underline">
                        {store.phone}
                      </a>
                    </p>
                    <p className="flex items-start gap-3">
                      <span className="text-white/60 mt-0.5 shrink-0">&#9200;</span>
                      <span className="text-sm">{store.hours}</span>
                    </p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <FadeInSection>
              <p className="text-white/40 font-heading text-sm tracking-[0.3em] uppercase mb-4">
                Visit Us
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mb-6 leading-relaxed">
                Experience the essence of luxury in person
              </h2>
              <p className="text-white/60 font-body text-lg mb-10 max-w-lg mx-auto">
                Visit any of our locations to explore our full collection and receive
                personalized fragrance consultations from our experts.
              </p>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201044415982'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-3 no-underline"
              >
                Contact Us for Directions
                <span className="text-lg">→</span>
              </a>
            </FadeInSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
