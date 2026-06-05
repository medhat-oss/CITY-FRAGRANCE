import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CollectionsGrid from '@/components/CollectionsGrid';
import { readJsonFile } from '@/lib/dataFile';
import type { CollectionData } from '@/types';

async function getCollectionImages(): Promise<Record<string, CollectionData>> {
  return readJsonFile<Record<string, CollectionData>>('collection-images.json', {});
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
