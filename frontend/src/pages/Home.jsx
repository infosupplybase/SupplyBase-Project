import HeroSlider from '../components/HeroSlider/HeroSlider';
import PopularServices from '../components/home/PopularServices';
import ConsultationBanner from '../components/home/ConsultationBanner';
import HowBookingWorks from '../components/services/HowBookingWorks';
import StatsSection from '../components/home/StatsSection';
import CustomerReviews from '../components/home/CustomerReviews';
import CtaBand from '../components/ui/CtaBand';
import { HomeWhyChoose, HomeBeforeAfter, HomeAvailability, HomeFaq } from '../components/home/HomeExtras';

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

      <ConsultationBanner />

      <HomeWhyChoose />
      <StatsSection />
      <HomeBeforeAfter />
      <CustomerReviews />
      <HomeAvailability />
      <HomeFaq />
      <CtaBand />
    </div>
  );
}
