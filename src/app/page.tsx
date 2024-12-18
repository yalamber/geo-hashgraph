import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Homepage from '@/components/page/Home';

export default function Home() {
  return (
    <>
      <Header pageTitle={'my geo.tags'} />
      <Homepage />
      <Footer />
    </>
  );
}
