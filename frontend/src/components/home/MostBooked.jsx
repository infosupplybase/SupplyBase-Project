import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

export default function MostBooked() {
  const featured = [
    {
      tag: 'Best Seller',
      title: 'Full Home Interior',
      subtitle: 'Starting ₹4.5L · 45-day delivery',
      image: '/assets/hero/interior-design-clean.png',
      cta: 'Book Now',
      link: '/services/interior-design',
      tagColor: '#d4af37',
    },
    {
  tag: 'Recommended',
  title: 'Terrace Waterproofing',
  subtitle: 'Leak-proof · 5-year warranty',
  image: '/assets/hero/plumbing-clean.png',
  cta: 'Explore',
  link: '/services/waterproofing',
  tagColor: '#b8960c',
},
    {
      tag: 'Trending',
      title: 'Complete Wiring',
      subtitle: 'ISI wire · Free point layout',
      image: '/assets/hero/electrical-clean.png',
      cta: 'Book Now',
      link: '/services/electrical',
      tagColor: '#8a6f08',
    },
  ];

  return (
    <section className="uc-spotlight-section">
      <div className="uc-container">
        <div className="uc-spotlight-header">
          <span className="uc-eyebrow">MOST BOOKED</span>
          <h2 className="uc-spotlight-title">In the spotlight this month</h2>
        </div>

        <div className="uc-spotlight-grid">
          {featured.map((item) => (
            <div
              key={item.title}
              className="uc-spotlight-card"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <span
                className="uc-spotlight-tag"
                style={{ background: item.tagColor }}
              >
                {item.tag}
              </span>

              <div className="uc-spotlight-body">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
                <Link to={item.link} className="uc-spotlight-cta">
                  {item.cta}
                  <Icon name="arrow-right" size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}