'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const values = [
  {
    en: { title: 'Quality', desc: 'Carefully curated premium fragrances sourced from around the world, ensuring every bottle meets the highest standards of excellence.' },
    ar: { title: 'الجودة', desc: 'مجموعة مختارة من العطور الفاخرة من جميع أنحاء العالم، لضمان أعلى مستويات الجودة والتميز في كل زجاجة.' },
    icon: '✦',
  },
  {
    en: { title: 'Value', desc: 'True elegance should never be defined by a price tag. We deliver exceptional experiences at honest, accessible prices.' },
    ar: { title: 'القيمة', desc: 'الأناقة الحقيقية لا تُحدد بسعر مرتفع. نقدم تجارب استثنائية بأسعار مناسبة وصادقة.' },
    icon: '◆',
  },
];

function FadeInSection({ children, className = '', delay = 0, ...rest }: { children: React.ReactNode; className?: string; delay?: number } & React.HTMLAttributes<HTMLDivElement>) {
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
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default function OurStory() {
  return (
    <div className="bg-[#09142E] text-white/80 font-body">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/product-placeholder.png')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09142E]/60 via-[#09142E]/80 to-[#09142E]" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-gold/60 font-heading text-sm tracking-[0.3em] uppercase mb-6 animate-fade-up">
            City Fragrance
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-6 animate-fade-up">
            OUR STORY
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl text-gold font-light mt-2 inline-block">
              قصتنا
            </span>
          </h1>
          <div className="w-16 h-px bg-gold/60 mx-auto animate-fade-up" />
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* English */}
          <FadeInSection className="space-y-8" delay={150}>
            <div>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mb-6">
                Welcome to <span className="text-gold">City Fragrance</span>
              </h2>
              <div className="w-12 h-0.5 bg-gold/60 mb-8" />
            </div>
            <p className="text-white/70 text-lg leading-relaxed">
              We are an Egyptian brand specializing in offering a curated selection of premium Arabic
              and international fragrances that blend elegance, comfort, and affordability. We officially
              entered the Egyptian market on <span className="text-gold font-medium">February 10, 2026</span>.
            </p>
            <p className="text-white/70 text-lg leading-relaxed">
              Our mission is to provide carefully selected, contemporary scents that evoke the exact
              feelings of distinction and luxury you desire, with absolute dedication to the customer
              journey—from the moment you order until delivery.
            </p>
            <p className="text-white/70 text-lg leading-relaxed">
              We firmly believe that true elegance shouldn&apos;t be defined by a high price tag.
              Therefore, we continuously strive to deliver the absolute best experience and premium value.
            </p>
            <p className="text-gold/80 text-lg italic">
              Thank you for choosing and trusting City Fragrance.
            </p>
          </FadeInSection>

          {/* Arabic — RTL */}
          <FadeInSection className="space-y-8" dir="rtl" delay={300}>
            <div className="text-right">
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mb-6">
                مرحبًا بك في <span className="text-gold">City Fragrance</span>
              </h2>
              <div className="w-12 h-0.5 bg-gold/60 mr-auto" />
            </div>
            <p className="text-white/70 text-lg leading-relaxed">
              نحن علامة تجارية مصرية متخصصة في تقديم جميع انواع العطور العربيه والعالميه
              تجمع بين الأناقة، الراحة، بأسعار مناسبة.
              انضممنا في السوق المصري بتاريخ <span className="text-gold font-medium">10/2/2026</span>
            </p>
            <p className="text-white/70 text-lg leading-relaxed">
              هدفنا هو توفير أحدث العطور المختارة بعناية لتمنحك نفس الإحساس والشكل المميز الذي
              تبحث عنه، مع اهتمام كامل بتجربة العميل بدايةً من الطلب وحتى الاستلام.
            </p>
            <p className="text-white/70 text-lg leading-relaxed">
              نؤمن أن الأناقة ليست مرتبطة بالسعر المرتفع، لذلك نعمل دائمًا على تقديم أفضل
              معامله ممكنة مقابل أفضل قيمة.
            </p>
            <p className="text-gold/80 text-lg italic text-left">
              وشكرآ لثقتكم في City Fragrance.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ─── Timeline / Date Badge ─── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <FadeInSection>
            <p className="text-gold/50 font-heading text-sm tracking-[0.3em] uppercase mb-6">
              Our Journey Began
            </p>
            <div className="inline-flex items-center gap-6 border border-gold/30 rounded-2xl px-10 py-8 bg-[#09142E]/80 backdrop-blur-sm shadow-[0_0_40px_rgba(197,160,89,0.08)]">
              <div className="text-right" dir="rtl">
                <p className="text-white/60 text-sm font-heading tracking-wider mb-1">
                  انضممنا في السوق المصري
                </p>
                <p className="text-4xl sm:text-5xl font-heading font-light text-gold tracking-wider">
                  10 / 2 / 2026
                </p>
              </div>
              <div className="w-px h-16 bg-gold/30" />
              <div className="text-left">
                <p className="text-white/60 text-sm font-heading tracking-wider mb-1">
                  Egypt Market Launch
                </p>
                <p className="text-4xl sm:text-5xl font-heading font-light text-gold tracking-wider">
                  Feb 10, 2026
                </p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── Core Values Grid ─── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <FadeInSection>
          <div className="text-center mb-16">
            <p className="text-gold/60 font-heading text-sm tracking-[0.3em] uppercase mb-4">
              What We Stand For
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-white">
              Our Core Values
            </h2>
            <div className="w-12 h-0.5 bg-gold/60 mx-auto mt-6" />
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {values.map((v, i) => (
            <FadeInSection key={v.en.title} delay={i * 150}>
              <div className="group relative h-full border border-white/10 rounded-2xl p-8 bg-white/[0.03] transition-all duration-500 hover:border-gold/40 hover:bg-gold/[0.03] hover:shadow-[0_0_40px_rgba(197,160,89,0.06)]">
                <div className="text-3xl text-gold/60 mb-6 group-hover:scale-110 transition-transform duration-500">
                  {v.icon}
                </div>
                {/* English */}
                <h3 className="font-heading text-2xl font-light text-white mb-3">
                  {v.en.title}
                </h3>
                <p className="text-white/60 leading-relaxed mb-6">
                  {v.en.desc}
                </p>
                {/* Divider */}
                <div className="w-full h-px bg-gold/20 mb-6" />
                {/* Arabic */}
                <div dir="rtl">
                  <h3 className="font-heading text-xl font-light text-gold/80 mb-2">
                    {v.ar.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed text-sm">
                    {v.ar.desc}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <FadeInSection>
            <p className="text-gold/40 font-heading text-sm tracking-[0.3em] uppercase mb-4">
              Join Our World
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mb-8 leading-relaxed">
              &ldquo;نؤمن أن الأناقة ليست مرتبطة بالسعر المرتفع&rdquo;
              <br />
              <span className="text-xl sm:text-2xl text-white/60 mt-3 inline-block">
                We believe true elegance isn&apos;t defined by price.
              </span>
            </h2>
            <Link
              href="/collections"
              className="btn btn-primary inline-flex items-center gap-3 no-underline mt-4"
            >
              Explore Our Collection
              <span className="text-lg">→</span>
            </Link>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
