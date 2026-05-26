'use client';
export const dynamic = 'force-dynamic';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PrivacyPolicy from '@/components/PrivacyPolicy';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#09142E] text-white">
      <Header />
      <main>
        <PrivacyPolicy />
      </main>
      <Footer />
    </div>
  );
}
