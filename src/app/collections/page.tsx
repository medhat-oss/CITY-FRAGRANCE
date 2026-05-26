import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CollectionsGrid from '@/components/CollectionsGrid';
import { readJsonFile } from '@/lib/dataFile';

export const dynamic = 'force-dynamic';

async function getCollectionImages(): Promise<Record<string, string>> {
  return readJsonFile<Record<string, string>>('collection-images.json', {});
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
