import PopularServices from '../components/home/PopularServices';
import StatsStrip from '../components/home/StatsStrip';
import MostBooked from '../components/home/MostBooked';
import HomeCta from '../components/home/HomeCta';
import HowItWorks from '../components/home/HowItWorks';
import OurPromise from '../components/home/OurPromise';

export default function Home() {
  return (
    <div className="page-home">

      {/* 1. Popular Services */}
      <PopularServices />

      {/* 2. Stats Strip */}
      <StatsStrip />

      {/* 3. Most Booked / Spotlight */}
      <MostBooked />

      {/* 4. Clean CTA */}
      <HomeCta />

      {/* 5. How It Works */}
      <HowItWorks />

      {/* 6. Our Promise */}
      <OurPromise />

    </div>
  );
}