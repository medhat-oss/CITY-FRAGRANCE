'use client';

import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppButton() {
  return (
    <div className="group fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Label — slides in on hover */}
      <span className="pointer-events-none select-none whitespace-nowrap rounded-lg bg-[#09142E]/90 backdrop-blur-sm border border-white/10 px-4 py-2 text-xs font-heading tracking-wider text-white/80 shadow-lg opacity-0 translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        Chat with us
      </span>

      <a
        href="https://wa.me/201044415982"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] animate-waft"
        aria-label="Chat with us on WhatsApp"
      >
        <FaWhatsapp className="w-7 h-7" />
      </a>
    </div>
  );
}
