import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingActions from './FloatingActions';
import ScrollToTop from './ScrollToTop';

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
    </>
  );
}
