'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BestSellers from '@/components/BestSellers';
import CollectionCategories from '@/components/CollectionCategories';
import Footer from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { ServicesSection } from '@/components/ServicesSection';

export default function Home() {
  const { isLoaded, getBestSellers } = useProducts();

  if (!isLoaded) return null;

  const bestSellers = getBestSellers();

  return (
    <div className="bg-white dark:bg-[#09142E] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />
      <main>
        <Hero />
        <CollectionCategories />
        <BestSellers title="Best Sellers" products={bestSellers} />
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
