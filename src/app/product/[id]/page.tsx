'use client';
export const dynamic = 'force-dynamic';

import { use, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiMinus, HiPlus, HiChevronDown, HiShoppingBag, HiBolt, HiXMark, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { formatEGP } from '@/utils/currency';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { products, isLoaded } = useProducts();
  const { addToCart, openCart, buyNow } = useCart();
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVolume, setSelectedVolume] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const product = products.find((p) => p.id === id);

  const productImages = product?.images?.length
    ? product.images
    : ['/images/product-placeholder.png'];

  const activeImage = imgError[activeImageIndex]
    ? '/placeholder.png'
    : productImages[activeImageIndex] || productImages[0];

  const volumeOptions = (product?.volume || '100 ML')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const activeVol =
    selectedVolume && volumeOptions.includes(selectedVolume)
      ? selectedVolume
      : volumeOptions[0];

  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  }, [productImages.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  }, [productImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, goToPrev, goToNext]);

  const notesList = product?.notes
    ? product.notes.split('•').map((n) => n.trim()).filter(Boolean)
    : [];

  const third = Math.ceil(notesList.length / 3) || 1;
  const topNotes = notesList.slice(0, third);
  const middleNotes = notesList.slice(third, third * 2);
  const baseNotesList = notesList.slice(third * 2);

  if (!isLoaded) {
    return <div className="h-screen bg-white dark:bg-[#09142E]" />;
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center px-8 py-32 text-center">
          <h1 className="font-heading text-4xl text-navy dark:text-white mb-3">Product Not Found</h1>
          <p className="font-body text-ink-lighter dark:text-slate-300 mb-8">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/" className="btn btn-primary">
            Return to Store
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-white dark:bg-[#09142E] text-slate-900 dark:text-slate-100 transition-colors duration-300 px-4 sm:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="max-w-container mx-auto flex items-center gap-2 text-xs uppercase tracking-widest text-ink-lighter dark:text-slate-400 mb-8">
          <Link href="/" className="hover:text-navy dark:hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <Link href="/" className="hover:text-navy dark:hover:text-white transition-colors">
            {product.category}
          </Link>
          <span className="text-gray-300 dark:text-slate-600">/</span>
          <span className="text-navy dark:text-white font-medium">{product.name}</span>
        </nav>

        {/* 2-Column Grid */}
        <div className="max-w-container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* ═══ LEFT: Image Gallery ═══ */}
          <div className="flex gap-4 flex-col-reverse sm:flex-row lg:sticky lg:top-32">
            {/* Thumbnails (vertical on desktop, horizontal on mobile) */}
            <div className="flex sm:flex-col gap-2 sm:gap-3 shrink-0">
              {productImages.map((url, index) => (
                <button
                  key={index}
                  onClick={() => { setActiveImageIndex(index); setImgError((prev) => ({ ...prev, [index]: false })); }}
                  className={`w-16 h-20 sm:w-[80px] sm:h-[100px] shrink-0 overflow-hidden rounded-sm border-2 transition-all duration-300 ease-in-out ${
                    index === activeImageIndex
                      ? 'border-white opacity-100 shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                      : 'border-white/10 opacity-50 hover:opacity-80 hover:border-white/30'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={100}
                    className="w-full h-full object-cover"
                    onError={() => setImgError((prev) => ({ ...prev, [index]: true }))}
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <button
              onClick={() => { setLightboxOpen(true); setLightboxIndex(activeImageIndex); }}
              className="relative flex-1 aspect-[3/4] bg-[#f8f8f8] dark:bg-slate-900 overflow-hidden rounded-sm cursor-zoom-in text-left focus:outline-none"
            >
              {product.badge && (
                <span
                  className={`absolute top-4 left-4 z-10 font-heading text-xs font-semibold tracking-widest px-3 py-1.5 uppercase rounded-sm ${
                    product.badge.toUpperCase().includes('SALE')
                      ? 'bg-sale text-white'
                      : 'bg-navy text-white'
                  }`}
                >
                  {product.badge}
                </span>
              )}
              <div className="relative w-full h-full">
                <Image
                  key={activeImageIndex}
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-cover animate-fade-up"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              {productImages.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10 bg-navy/80 text-white text-[0.6rem] font-heading tracking-wider px-2.5 py-1 rounded-full">
                  {activeImageIndex + 1} / {productImages.length}
                </div>
              )}
            </button>
          </div>

          {/* ═══ RIGHT: Product Details ═══ */}
          <div className="flex flex-col gap-0">
            {/* Brand */}
            <div className="flex items-center gap-3 mb-2">
              <span className="font-heading text-[0.7rem] tracking-[0.25em] text-ink-lighter uppercase">
                City Fragrance
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-normal text-navy dark:text-white uppercase tracking-wide leading-tight mb-1.5">
              {product.name}
            </h1>

            {/* Category Tags */}
            <p className="font-body text-sm tracking-widest text-ink-lighter dark:text-slate-300 uppercase mb-5">
              {notesList.slice(0, 3).join(' | ') || product.category}
            </p>

            {/* Pricing */}
            <div className="flex items-center gap-4 mb-6">
              {product.salePrice ? (
                <>
                  <span className="font-heading text-2xl sm:text-3xl font-semibold text-sale tracking-tight">
                    {formatEGP(product.salePrice)}
                  </span>
                  <span className="font-heading text-lg text-ink-lighter line-through">
                    {formatEGP(product.price)}
                  </span>
                  <span className="font-heading text-xs font-semibold text-sale bg-red-50 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                    Sale
                  </span>
                </>
              ) : (
                <span className="font-heading text-2xl sm:text-3xl font-semibold text-navy dark:text-white tracking-tight">
                  {formatEGP(product.price)}
                </span>
              )}
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-slate-800 my-5" />

            {/* Attributes */}
            <div className="flex flex-col gap-5">
              {/* Concentration */}
              <div className="flex flex-col gap-2">
                <span className="font-heading text-[0.7rem] tracking-[0.15em] uppercase text-ink-light dark:text-slate-300 font-semibold">
                  Concentration
                </span>
                <div className="flex flex-wrap gap-2">
                  <button className="px-5 py-2.5 border-2 border-navy bg-navy text-white font-heading text-xs uppercase tracking-wider rounded-sm transition-all duration-200 hover:bg-navy-light">
                    {product.concentration || 'Eau De Parfum'}
                  </button>
                </div>
              </div>

              {/* Orientation */}
              {product.orientation && (
                <div className="flex flex-col gap-2">
                  <span className="font-heading text-[0.7rem] tracking-[0.15em] uppercase text-ink-light dark:text-slate-300 font-semibold">
                    Orientation
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-5 py-2.5 border-2 border-navy bg-navy text-white font-heading text-xs uppercase tracking-wider rounded-sm transition-all duration-300 ease-in-out hover:bg-navy-light">
                      {product.orientation}
                    </button>
                  </div>
                </div>
              )}

              {/* Volume */}
              <div className="flex flex-col gap-2">
                <span className="font-heading text-[0.7rem] tracking-[0.15em] uppercase text-ink-light dark:text-slate-300 font-semibold">
                  Volume
                </span>
                <div className="flex flex-wrap gap-2">
                  {volumeOptions.map((vol) => (
                    <button
                      key={vol}
                      onClick={() => setSelectedVolume(vol)}
                      className={`px-5 py-2.5 border-2 font-heading text-xs uppercase tracking-wider rounded-sm transition-all duration-300 ease-in-out ${
                        activeVol === vol
                          ? 'border-navy bg-navy text-white'
                          : 'border-gray-200 text-ink-light dark:border-slate-700 dark:text-slate-200 hover:border-navy dark:hover:border-navy hover:text-navy dark:hover:text-white'
                      }`}
                    >
                      {vol}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-slate-800 my-5" />

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border-2 border-gray-200 dark:border-slate-700 rounded-sm overflow-hidden">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-11 h-11 flex items-center justify-center bg-transparent dark:bg-slate-800 border-none cursor-pointer text-ink-light dark:text-slate-200 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
                  aria-label="Decrease quantity"
                >
                  <HiMinus />
                </button>
                <span className="w-12 text-center font-heading text-base font-medium text-navy dark:text-white border-x-2 border-gray-200 dark:border-slate-700 leading-[44px]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-11 h-11 flex items-center justify-center bg-transparent dark:bg-slate-800 border-none cursor-pointer text-ink-light dark:text-slate-200 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
                  aria-label="Increase quantity"
                >
                  <HiPlus />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => { addToCart(product, quantity); openCart(); }}
              className="w-full py-4 font-heading text-sm font-semibold tracking-[0.2em] uppercase border-2 border-[#F9FAFB] bg-[#F9FAFB] text-[#09142E] cursor-pointer rounded-sm flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-[#E5E7EB] hover:text-white hover:border-[#E5E7EB] mb-3"
            >
              <HiShoppingBag className="mr-2.5" /> Add to Cart
            </button>

            <button
              onClick={() => { buyNow(product, quantity, activeVol); router.push('/order-payment'); }}
              className="w-full py-4 font-heading text-sm font-semibold tracking-[0.2em] uppercase border-2 border-[#F9FAFB] bg-[#F9FAFB] text-[#09142E] cursor-pointer rounded-sm flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-[#E5E7EB] hover:text-white hover:border-[#E5E7EB]"
            >
              <HiBolt className="mr-2.5" /> Buy It Now
            </button>

            <div className="w-full h-px bg-gray-100 dark:bg-slate-800 my-5" />

            {/* Description Accordion */}
            <div>
              <button
                onClick={() => setDescOpen(!descOpen)}
                className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer py-3 font-heading text-xs tracking-[0.2em] uppercase text-navy dark:text-white font-semibold transition-all duration-300 ease-in-out hover:text-white"
              >
                <span>Description</span>
                <HiChevronDown
                  className={`text-sm transition-transform duration-300 ease-in-out ${
                    descOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {descOpen && (
                <div className="pt-2 pb-4 animate-fade-up">
                  <p className="font-body text-sm leading-relaxed text-ink-light dark:text-slate-300 text-justify">
                    {product.description || (
                      <>
                        Discover the essence of luxury with{' '}
                        <strong className="text-navy dark:text-white">{product.name}</strong>.
                        Carefully crafted with the finest ingredients, this exquisite{' '}
                        {product.category.toLowerCase()} fragrance offers a long-lasting,
                        unforgettable signature scent. A sophisticated composition of{' '}
                        {product.notes} that captures the spirit of modern elegance and
                        timeless Middle Eastern perfumery tradition.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="w-full h-px bg-gray-100 dark:bg-slate-800 my-5" />

            {/* Perfume Notes Accordion */}
            <div>
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer py-3 font-heading text-xs tracking-[0.2em] uppercase text-navy dark:text-white font-semibold transition-all duration-300 ease-in-out hover:text-white"
              >
                <span>Perfume Notes</span>
                <HiChevronDown
                  className={`text-sm transition-transform duration-300 ease-in-out ${
                    notesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {notesOpen && (
                <div className="flex flex-col gap-3 pt-2 pb-4 animate-fade-up">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <span className="font-heading text-[0.7rem] tracking-[0.1em] uppercase text-ink-lighter dark:text-slate-400 font-semibold min-w-[110px] shrink-0">
                      Top Notes
                    </span>
                    <span className="font-body text-sm text-ink-light dark:text-slate-300">
                      {topNotes.join(', ') || '\u2014'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <span className="font-heading text-[0.7rem] tracking-[0.1em] uppercase text-ink-lighter dark:text-slate-400 font-semibold min-w-[110px] shrink-0">
                      Middle Notes
                    </span>
                    <span className="font-body text-sm text-ink-light dark:text-slate-300">
                      {middleNotes.join(', ') || '\u2014'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
                    <span className="font-heading text-[0.7rem] tracking-[0.1em] uppercase text-ink-lighter dark:text-slate-400 font-semibold min-w-[110px] shrink-0">
                      Base Notes
                    </span>
                    <span className="font-body text-sm text-ink-light dark:text-slate-300">
                      {baseNotesList.join(', ') || '\u2014'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Lightbox ─── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 z-10 text-white/70 hover:text-white transition-all duration-300 ease-in-out hover:scale-110"
            aria-label="Close lightbox"
          >
            <HiXMark className="text-3xl" />
          </button>

          {productImages.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white transition-all duration-300 ease-in-out hover:scale-110"
                aria-label="Previous image"
              >
                <HiChevronLeft className="text-4xl" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white transition-all duration-300 ease-in-out hover:scale-110"
                aria-label="Next image"
              >
                <HiChevronRight className="text-4xl" />
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-5xl max-h-[90vh] mx-auto p-8 flex items-center justify-center">
            <Image
              src={productImages[lightboxIndex] || '/images/product-placeholder.png'}
              alt={`${product.name} ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {productImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 font-heading text-sm tracking-wider">
              {lightboxIndex + 1} / {productImages.length}
            </div>
          )}
        </div>
      )}

      <Footer />
    </>
  );
}
