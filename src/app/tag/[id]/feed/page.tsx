import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import TagFeedPage from '@/components/page/TagFeed';

export default async function TagFeed({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return (
    <>
      <Header pageTitle={`my geo.tags • ${id} • feed`} />
      <TagFeedPage />
      <Footer />
    </>
  );
}
