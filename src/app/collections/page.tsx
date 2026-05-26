import { promises as fs } from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CollectionsGrid from '@/components/CollectionsGrid';

export const dynamic = 'force-dynamic';

async function getCollectionImages(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'data', 'collection-images.json'),
      'utf-8'
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function CollectionsPage() {
  const initialImages = await getCollectionImages();

  return (
    <div className="bg-[#09142E] text-white">
      <Header />
      <main>
        <CollectionsGrid initialImages={initialImages} />
      </main>
      <Footer />
    </div>
  );
}
