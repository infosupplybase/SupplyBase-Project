import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingActions from './FloatingActions';
import ScrollToTop from './ScrollToTop';
// BookBar (the sticky "Site visit + quotation / BOOK NOW" bar) is disabled
// sitewide on request. Import kept, not deleted, so re-enabling is a
// two-line diff.
// import BookBar from './BookBar';
import BottomNav from './BottomNav';

/**
 * Layout — header + page + footer shell shared by every route.
 */
export default function Layout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
      {/* <BookBar /> */}
      <BottomNav />
    </>
  );
}
