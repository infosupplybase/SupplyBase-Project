import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider/HeroSlider';
import PopularServices from '../components/home/PopularServices';
import ConsultationBanner from '../components/home/ConsultationBanner';
import HowBookingWorks from '../components/services/HowBookingWorks';
import StatsSection from '../components/home/StatsSection';
import Reveal from '../components/ui/Reveal';
import CtaBand from '../components/ui/CtaBand';
import Icon from '../components/ui/Icon';
import CustomerReviews from '../components/home/CustomerReviews';

export default function Home() {
  return (
    <div className="page-home">

      <HeroSlider />

      <PopularServices />

      <section className="home-how" aria-label="How booking works">
        <div className="container">
          <HowBookingWorks />
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Customer Reviews - directly below Stats */}
      <CustomerReviews />

      <ConsultationBanner />

      <CtaBand />

    </div>
  );
}