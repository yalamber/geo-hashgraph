import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import TagBeaconPage from '@/components/page/TagBeacon';

export default async function TagDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return (
    <>
      <Header pageTitle={`my geo.tags • ${id} • Beacon`} />
      <TagBeaconPage />
      <Footer />
    </>
  );
}
