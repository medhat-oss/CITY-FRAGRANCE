'use client';

import { HiOutlineGift, HiOutlineShieldCheck, HiOutlineArrowPath } from 'react-icons/hi2';
import { useLocale } from '@/context/LocaleContext';

export function ServicesSection() {
  const { dir } = useLocale();

  return (
    <section className="py-16 px-4 sm:px-8 bg-cream dark:bg-[#09142E] border-t border-navy/10 dark:border-slate-800" dir={dir}>
      <div className="max-w-container mx-auto">
        <div className="flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible text-center">
          <div className="group flex flex-col items-center snap-center shrink-0 w-[80vw] sm:w-auto">
            <HiOutlineGift className="text-3xl text-white mb-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <h3 className="font-heading text-lg text-navy dark:text-white mb-1">Premium Packaging</h3>
            <p className="font-body text-sm text-ink-lighter dark:text-slate-400">An elegant unboxing experience</p>
          </div>
          <div className="group flex flex-col items-center snap-center shrink-0 w-[80vw] sm:w-auto">
            <HiOutlineShieldCheck className="text-3xl text-white mb-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <h3 className="font-heading text-lg text-navy dark:text-white mb-1">Secure Checkout</h3>
            <p className="font-body text-sm text-ink-lighter dark:text-slate-400">100% secure payment</p>
          </div>
          <div className="group flex flex-col items-center snap-center shrink-0 w-[80vw] sm:w-auto">
            <HiOutlineArrowPath className="text-3xl text-white mb-4 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <h3 className="font-heading text-lg text-navy dark:text-white mb-1">Easy Returns</h3>
            <p className="font-body text-sm text-ink-lighter dark:text-slate-400">30-day return policy</p>
          </div>
        </div>
      </div>
    </section>
  );
}
