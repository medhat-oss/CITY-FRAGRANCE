'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FaInfoCircle } from 'react-icons/fa';

const STORAGE_KEY = 'cf_demo_disclaimer_seen';

export default function DisclaimerModal() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isStorefront =
    mounted && !pathname.startsWith('/admin') && !pathname.startsWith('/cashier');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isStorefront) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // storage unavailable — still show the notice
    }
    if (!seen) setIsOpen(true);
  }, [mounted, isStorefront]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable — modal still closes for this page view
    }
    setIsOpen(false);
  }

  if (!isStorefront || !isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-lg p-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111B3D] shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-4">
            <span className="flex items-center justify-center w-11 h-11 shrink-0 rounded-full bg-white/10 text-white">
              <FaInfoCircle className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="disclaimer-title"
                className="font-heading text-xl font-semibold text-white m-0"
              >
                Demo &amp; Portfolio Notice
              </h2>
              <p className="text-slate-300 text-xs uppercase tracking-widest mt-1 mb-0">
                Showcase Website
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-[#cbd5e1]">
            <p className="m-0">
              This website is a <strong className="text-white">demo and portfolio showcase</strong> only.
              It is <strong className="text-white">strictly not intended for active commercial use</strong> —
              no real orders are processed, and any purchases made through this site will not be fulfilled.
            </p>
            <p className="m-0 text-[#94a3b8]">
              Please visit the official live store for genuine products, ordering, and customer support.
            </p>
          </div>

          <div className="mt-6">
            <a
              href="https://city-fragrance.store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center px-5 py-3 rounded-lg border border-white/20 text-white text-sm font-semibold font-heading tracking-wide no-underline transition-all duration-300 ease-in-out hover:bg-white/10"
            >
              Visit city-fragrance.store →
            </a>
            <p className="mt-3 text-center text-[11px] text-[#64748b] leading-snug m-0">
              (Note: The external website at city-fragrance.store is a separate entity and is not
              developed, owned, or maintained by us.)
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={dismiss}
              className="w-full px-5 py-3 rounded-lg bg-white text-black text-sm font-bold font-heading tracking-wide border-none cursor-pointer transition-all duration-300 ease-in-out hover:bg-neutral-200"
            >
              Continue to Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
