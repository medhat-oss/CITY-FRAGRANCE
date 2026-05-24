'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';
import { useLocale } from '@/context/LocaleContext';

const policySections = [
  {
    en: {
      title: 'Exchange & Returns Policy',
      intro: 'We are committed to providing the finest shopping experience for our discerning clientele. Please review our exchange and returns policy below.',
    },
    ar: {
      title: 'سياسة الاستبدال والاسترجاع',
      intro: 'نحن نسعى دائمًا لتقديم أفضل تجربة تسوق لعملائنا.',
    },
    rules: [
      {
        en: 'The customer is entitled to request an exchange within 14 days from the date of order delivery.',
        ar: '• يحق للعميل طلب الاستبدال خلال 14 يومًا من تاريخ استلام الطلب.',
      },
      {
        en: 'Original boutique fragrances are strictly non-refundable due to hygiene, safety, and quality control standards.',
        ar: '• لا يوجد استرجاع نهائي في العطور الأصلية (الأوريجنال).',
      },
      {
        en: 'The product must be in its original condition, unused, and returned with all original labels, seals, and packaging intact.',
        ar: '• يجب أن يكون المنتج بحالته الأصلية وغير مستخدم، مع وجود جميع الملصقات والتغليف الأصلي.',
      },
      {
        en: 'Products that have been used, damaged, or show signs of misuse are not eligible for exchange or return.',
        ar: '• لا يمكن استبدال أو استرجاع المنتجات التي تعرضت للاستخدام أو التلف بسبب سوء الاستخدام.',
      },
      {
        en: 'The customer bears all shipping costs related to exchange or return, unless the reason is an error on the part of the store or a manufacturing defect.',
        ar: '• يتحمل العميل رسوم الشحن الخاصة بالاستبدال أو الاسترجاع ما لم يكن السبب خطأ من المتجر أو عيبًا بالمنتج.',
      },
    ],
  },
  {
    en: {
      title: 'Exchange Request Procedure',
      intro: 'To ensure a seamless process, please follow the steps below for all exchange requests.',
    },
    ar: {
      title: 'خطوات طلب الاستبدال',
      intro: 'لضمان سلاسة العملية، يرجى اتباع الخطوات التالية لطلب الاستبدال:',
    },
    steps: [
      {
        en: 'Contact our Customer Care team and clearly explain the reason for your request.',
        ar: '١. التواصل مع خدمة العملاء وتوضيح سبب الطلب.',
      },
      {
        en: 'Provide your order number along with photographs of the product (if applicable).',
        ar: '٢. إرسال رقم الطلب وصور المنتج (إن وجدت مشكلة).',
      },
      {
        en: 'Await confirmation from our Customer Care team before proceeding.',
        ar: '٣. انتظار تأكيد الطلب من فريق خدمة العملاء.',
      },
      {
        en: 'Hand over the product to the designated shipping courier or representative per the instructions provided.',
        ar: '٤. تسليم المنتج لشركة الشحن أو المندوب وفق التعليمات المرسلة.',
      },
    ],
  },
];

function FadeSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  );
}

export default function PrivacyPolicy() {
  const { dir } = useLocale();

  return (
    <div className="bg-[#09142E] min-h-screen font-body text-white/80" dir={dir}>
      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.02] via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-gold/50 font-heading text-sm tracking-[0.3em] uppercase mb-4">
            City Fragrance
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-4">
            PRIVACY & RETURNS
          </h1>
          <p className="font-heading text-2xl sm:text-3xl text-gold/70 font-light">
            سياسة الخصوصية والاستبدال
          </p>
          <div className="w-16 h-px bg-gold/50 mx-auto mt-6" />
          <p className="text-white/50 mt-8 max-w-2xl mx-auto text-base leading-relaxed">
            Our commitment to transparency, quality, and your satisfaction — outlined clearly.
          </p>
        </div>
      </section>

      {/* ─── Policy Sections ─── */}
      <section className="max-w-7xl mx-auto px-6 pb-24 space-y-20">
        {policySections.map((section, idx) => (
          <FadeSection key={idx} delay={idx * 150}>
            {/* English */}
            <div className="mb-12">
              <h2 className="font-heading text-2xl sm:text-3xl font-light text-white mb-3">
                {section.en.title}
              </h2>
              <div className="w-10 h-0.5 bg-gold/60 mb-6" />
              {section.en.intro && (
                <p className="text-white/70 text-base leading-relaxed mb-6 max-w-3xl">
                  {section.en.intro}
                </p>
              )}
              {'rules' in section && section.rules && (
                <ul className="space-y-4">
                  {section.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/70 text-base leading-relaxed">
                      <span className="text-gold mt-1.5 shrink-0">•</span>
                      <span>{rule.en}</span>
                    </li>
                  ))}
                </ul>
              )}
              {'steps' in section && section.steps && (
                <ol className="space-y-4">
                  {section.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/70 text-base leading-relaxed">
                      <span className="text-gold font-heading text-sm mt-0.5 shrink-0 w-6">{i + 1}.</span>
                      <span>{step.en}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/5 mb-12" />

            {/* Arabic */}
            <div dir="rtl">
              <h2 className="font-heading text-2xl sm:text-3xl font-light text-gold/80 mb-3 text-right">
                {section.ar.title}
              </h2>
              <div className="w-10 h-0.5 bg-gold/40 mr-0 ml-auto mb-6" />
              {section.ar.intro && (
                <p className="text-white/60 text-base leading-relaxed mb-6 text-right">
                  {section.ar.intro}
                </p>
              )}
              {'rules' in section && section.rules && (
                <ul className="space-y-4">
                  {section.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60 text-base leading-relaxed">
                      <span className="text-gold mt-1.5 shrink-0">•</span>
                      <span className="text-right">{rule.ar}</span>
                    </li>
                  ))}
                </ul>
              )}
              {'steps' in section && section.steps && (
                <ol className="space-y-4">
                  {section.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60 text-base leading-relaxed">
                      <span className="text-gold font-heading text-sm mt-0.5 shrink-0 w-6">{i + 1}.</span>
                      <span className="text-right">{step.ar}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </FadeSection>
        ))}
      </section>

      {/* ─── Contact / Customer Care ─── */}
      <section className="border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <FadeSection delay={300}>
            <div className="text-center mb-10">
              <p className="text-gold/50 font-heading text-sm tracking-[0.3em] uppercase mb-4">
                Need Assistance?
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl font-light text-white mb-4">
                Contact Customer Care
              </h2>
              <div className="w-10 h-0.5 bg-gold/50 mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* English */}
              <div>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  For any inquiries regarding exchanges, returns, or our policies, please do not hesitate to reach out to our Customer Care team.
                </p>
                <div className="inline-flex items-center gap-3 border border-gold/30 rounded-xl px-6 py-4 bg-white/[0.02]">
                  <span className="text-gold/80 font-heading text-sm tracking-wider">Phone / WhatsApp</span>
                  <span className="text-white font-heading text-lg">01044415982</span>
                </div>
              </div>

              {/* Arabic */}
              <div dir="rtl">
                <p className="text-white/60 text-base leading-relaxed mb-6 text-right">
                  لأي استفسار بخصوص الاستبدال أو الاسترجاع أو سياساتنا، يرجى التواصل مع فريق خدمة العملاء.
                </p>
                <div className="inline-flex items-center gap-3 border border-gold/30 rounded-xl px-6 py-4 bg-white/[0.02]">
                  <span className="text-gold/80 font-heading text-sm tracking-wider">الهاتف / واتساب</span>
                  <span className="text-white font-heading text-lg" dir="ltr">01044415982</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-heading uppercase tracking-[0.15em] text-white/60 hover:text-gold transition-colors no-underline"
              >
                Back to Home <HiArrowRight />
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>
    </div>
  );
}
