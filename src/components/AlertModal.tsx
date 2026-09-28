'use client';

import React, { useEffect } from 'react';

export interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onClose: () => void;
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  type = 'info',
  onClose,
}: AlertModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultTitle =
    type === 'error'
      ? 'Error'
      : type === 'warning'
      ? 'Warning'
      : type === 'success'
      ? 'Success'
      : 'Notice';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16234D] p-6 shadow-2xl overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className={`font-heading text-lg font-semibold mb-2 ${
            type === 'error'
              ? 'text-rose-400'
              : type === 'warning'
              ? 'text-amber-400'
              : 'text-white'
          }`}
        >
          {title || defaultTitle}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>
        <div className="flex items-center justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 transition-all"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
