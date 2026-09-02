import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import FloatingActions from '../../components/layout/FloatingActions';
import ScrollToTop from '../../components/layout/ScrollToTop';
import BookBar from '../../components/layout/BookBar';

/**
 * Header + page + footer shell shared by every marketing/dashboard route.
 * Ported from the old <Layout> (which wrapped <Outlet/>) — this route group
 * is the direct replacement, scoped only to the pages that get this chrome;
 * /login and /register sit outside it, same as before.
 */
export default function SiteLayout({ children }) {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <FloatingActions />
      <BookBar />
    </>
  );
}
