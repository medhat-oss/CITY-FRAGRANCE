'use client';

import Link from 'next/link';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '201001234567';

interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SuccessPage({ searchParams }: PageProps) {
  const orderId = typeof searchParams.orderId === 'string' ? searchParams.orderId : '';

  const waText = encodeURIComponent(
    `Hello, I would like to confirm my order #${orderId}`
  );
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

  return (
    <div className="min-h-screen bg-[#09142E] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 text-3xl flex items-center justify-center mx-auto mb-6">
          &#10003;
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-light text-white mb-2">
          Order Received
        </h1>
        <p className="font-body text-slate-300 text-sm mb-2">
          Your order has been received successfully
        </p>

        {orderId && (
          <p className="font-heading text-gold text-sm tracking-wider mb-8">
            Order #{orderId}
          </p>
        )}

        <p className="font-body text-sm text-slate-300 leading-relaxed mb-8" style={{ lineHeight: '1.8' }}>
          Send a message via WhatsApp to confirm your order and begin shipping.
        </p>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-heading text-sm font-semibold uppercase tracking-wider rounded-sm transition-colors no-underline mb-8 w-full sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Confirm via WhatsApp
        </a>

        <div>
          <Link href="/" className="btn btn-primary btn-large">
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
