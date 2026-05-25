'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { formatEGP } from '@/utils/currency';
import { HiArrowRight, HiShoppingBag, HiBolt } from 'react-icons/hi2';

interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  productIds: string[];
}

export default function GiftSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { products } = useProducts();
  const { addGiftSetToCart, openCart, closeCart } = useCart();
  const [giftSet, setGiftSet] = useState<GiftSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gift-sets', { next: { revalidate: 60 } })
      .then((r) => r.json())
      .then((d) => {
        const found = (d.giftSets || []).find((gs: GiftSet) => gs.id === id);
        setGiftSet(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="h-screen bg-[#09142E]" />;
  }

  if (!giftSet) {
    return (
      <div className="bg-[#09142E] min-h-screen text-white">
        <Header />
        <main className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center">
            <p className="text-white/40 text-lg">Gift set not found</p>
            <Link href="/collections/gift-sets" className="text-gold hover:underline mt-4 inline-block">
              &larr; Back to Gift Sets
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const includedProducts = giftSet.productIds
    .map((pid) => products.find((p) => p.id === pid))
    .filter(Boolean) as typeof products;

  function handleAddToCart() {
    if (!giftSet) return;
    addGiftSetToCart({
      id: giftSet.id,
      name: giftSet.name,
      price: giftSet.price,
      image: giftSet.image,
    });
    openCart();
  }

  function handleBuyNow() {
    if (!giftSet) return;
    addGiftSetToCart({
      id: giftSet.id,
      name: giftSet.name,
      price: giftSet.price,
      image: giftSet.image,
    });
    closeCart();
    router.push('/payment-checkout');
  }

  return (
    <div className="bg-[#09142E] min-h-screen text-white">
      <Header />
      <main className="px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 mb-10">
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-gold transition-colors">Collections</Link>
            <span>/</span>
            <Link href="/collections/gift-sets" className="hover:text-gold transition-colors">Gift Sets</Link>
            <span>/</span>
            <span className="text-white/70">{giftSet.name}</span>
          </nav>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left: Image */}
            <div className="aspect-[4/5] relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10">
              <Image
                src={giftSet.image || '/images/product-placeholder.png'}
                alt={giftSet.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <span className="absolute top-4 left-4 bg-gold text-navy text-xs font-heading font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm">
                Gift Set
              </span>
            </div>

            {/* Right: Details */}
            <div className="flex flex-col gap-0">
              <span className="font-heading text-[0.7rem] tracking-[0.25em] text-gold/60 uppercase mb-2">
                City Fragrance
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light text-white uppercase tracking-wide leading-tight mb-4">
                {giftSet.name}
              </h1>
              <div className="w-12 h-px bg-gold/50 mb-6" />

              <p className="font-body text-base leading-relaxed text-white/60 mb-6">
                {giftSet.description}
              </p>

              <span className="font-heading text-3xl sm:text-4xl font-semibold text-amber-400 tracking-tight mb-8">
                {formatEGP(giftSet.price)}
              </span>

              {/* Included Perfumes */}
              <div className="border-t border-white/10 pt-6 mb-6">
                <h2 className="font-heading text-sm tracking-[0.2em] uppercase text-white/80 mb-4">
                  Included Perfumes
                </h2>
                {includedProducts.length === 0 ? (
                  <p className="text-white/40 text-sm">No products assigned yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {includedProducts.map((p, idx) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 transition-all duration-300 hover:bg-white/[0.06] hover:border-gold/40"
                      >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/10 text-gold text-xs font-heading font-semibold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-white/80 group-hover:text-amber-400 transition-colors truncate">
                            {p.name}
                          </p>
                          <p className="font-body text-[0.65rem] text-white/30 uppercase tracking-wider mt-0.5">
                            {p.category}
                          </p>
                        </div>
                        <span className="text-white/30 group-hover:text-gold transition-colors text-lg">
                          <HiArrowRight />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={handleAddToCart}
                className="w-full py-4 font-heading text-sm font-semibold tracking-[0.2em] uppercase border-2 border-gold bg-gold text-navy cursor-pointer rounded-sm flex items-center justify-center transition-all duration-200 hover:bg-transparent hover:text-gold mb-3"
              >
                <HiShoppingBag className="mr-2.5" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-4 font-heading text-sm font-semibold tracking-[0.2em] uppercase border-2 border-white/20 bg-white/5 text-white cursor-pointer rounded-sm flex items-center justify-center transition-all duration-200 hover:bg-gold hover:text-navy hover:border-gold"
              >
                <HiBolt className="mr-2.5" /> Buy It Now
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
