import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import TagDetailPage from '@/components/page/TagDetail';

export default async function TagDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return (
    <>
      <Header pageTitle={`my geo.tags • ${id}`} />
      <TagDetailPage />
      <Footer />
    </>
  );
}
