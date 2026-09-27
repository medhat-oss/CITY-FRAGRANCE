import Image from 'next/image';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BestSellers from '@/components/BestSellers';
import CollectionCategories from '@/components/CollectionCategories';
import Footer from '@/components/Footer';
import { ServicesSection } from '@/components/ServicesSection';
import { getOptimizedVideoUrl, getOptimizedImageUrl } from '@/lib/videoUtils';
import { loadHomepageData } from './HomepageData';

export const dynamic = 'force-dynamic';

export default async function Homepage() {
  const { settings, collectionImages, bestSellers } = await loadHomepageData();

  const moodTitle = settings.moodTitle;
  const moodSubtitle = settings.moodSubtitle;
  const isMoodTitleHidden = !moodTitle || moodTitle === 'HIDDEN' || moodTitle.trim() === '';
  const isMoodSubtitleHidden = !moodSubtitle || moodSubtitle === 'HIDDEN' || moodSubtitle.trim() === '';
  const showMoodBadge = !isMoodTitleHidden || !isMoodSubtitleHidden;
  const hasVideo = settings.moodVideoUrl || settings.moodVideoMobile;
  const hasImage = settings.moodImage || settings.moodImageDesktop;

  return (
    <div className="bg-white dark:bg-[#09142E] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Header />
      <main>
        <Hero settings={settings} />
        <CollectionCategories collectionData={collectionImages} />
        <BestSellers title="Best Sellers" products={bestSellers as any} />
        <section className="relative w-full bg-[#09142E] overflow-hidden mb-24 transform-gpu backface-hidden translate-z-0">
          {hasVideo ? (
            <>
              <video key="mood-video-mobile" src={getOptimizedVideoUrl(settings.moodVideoMobile || settings.moodVideoUrl)} autoPlay loop muted playsInline preload="metadata" className="w-full h-auto block md:hidden" />
              <video key="mood-video-desktop" src={getOptimizedVideoUrl(settings.moodVideoUrl || settings.moodVideoMobile)} autoPlay loop muted playsInline preload="metadata" className="w-full h-auto hidden md:block" />
            </>
          ) : hasImage ? (
            <>
              <Image src={getOptimizedImageUrl(settings.moodImage || settings.moodImageDesktop)} alt="Luxury fragrance ambiance" width={900} height={1200} loading="lazy" style={{ width: '100%', height: 'auto' }} className="block md:hidden" />
              <Image src={getOptimizedImageUrl(settings.moodImageDesktop || settings.moodImage)} alt="Luxury fragrance ambiance" width={1920} height={1080} loading="lazy" style={{ width: '100%', height: 'auto' }} className="hidden md:block" />
            </>
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/30">
            <div className="space-y-4 max-w-2xl">
              {showMoodBadge && <span className="font-heading text-sm sm:text-base uppercase tracking-[0.25em] text-white block mb-5 animate-fade-up opacity-0 [animation-delay:0.2s]">City Fragrance</span>}
              {!isMoodTitleHidden && <h2 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-6 animate-fade-up opacity-0 [animation-delay:0.4s] drop-shadow-[0_4px_15px_rgba(0,0,0,0.2)]">{moodTitle}</h2>}
              {!isMoodSubtitleHidden && <p className="font-body text-base sm:text-lg font-light max-w-md animate-fade-up opacity-0 [animation-delay:0.6s] text-white/90">{moodSubtitle}</p>}
            </div>
          </div>
        </section>
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
