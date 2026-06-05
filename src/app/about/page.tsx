'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OurStory from '@/components/OurStory';

export default function AboutPage() {
  return (
    <div className="bg-[#09142E] text-white">
      <Header />
      <main>
        <OurStory />
      </main>
      <Footer />
    </div>
  );
}
