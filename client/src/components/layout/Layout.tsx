import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Footer from '@/components/layout/Footer';
import PromoBanner from '@/components/layout/PromoBanner';
import ScrollToTop from '@/components/layout/ScrollToTop';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <PromoBanner />
      <Header />
      <MobileNav />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
