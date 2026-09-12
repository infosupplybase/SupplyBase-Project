import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';
import { getServiceBySlug } from '../../data/services';
import "../../styles/grid.css";

/* ============================================================
   MAIN SERVICE ICONS (For the Dropdown)
   ============================================================ */
const ICON_BY_SLUG = {
  'interior-design': 'sofa',
  'interior-by-choice': 'layers',
  painting: 'roller',
  waterproofing: 'droplet',
  'pop-ceiling-design': 'ceiling',
  plumbing: 'tap',
  electrical: 'bolt',
  'other-services': 'settings',
};

/* ============================================================
   SUB-SERVICE IMAGES (Pulled from public/assets/icons/)
   ============================================================ */
const SUBSERVICE_IMAGES = {
  /* ---------------- Interior Design ---------------- */
  'Full Home Interior': '/assets/icons/fullhome.png',
  'Living Room': '/assets/icons/livingroom.jpg',
  'Office': '/assets/icons/office.jpg',
  'Modular Kitchen': '/assets/icons/kitchen.png',
  'Wardrobe': '/assets/icons/wardrobe.jpg',
  'Dining Area': '/assets/icons/dining.png', // Note: Matches your file name exactly
  'Bedroom Interior': '/assets/icons/bedroom.jpg',
  'Renovation': '/assets/icons/Rennovation.jpg',

  /* ---------------- Painting ---------------- */
  // You will add these later when you download the images
  'Full Home Painting': '/assets/icons/fullhome.png', 
  'Renovation Painting': '/assets/icons/renopaint.png',
  'Room Painting': '/assets/icons/roompaint.png',
  'Few Walls Painting': '/assets/icons/fewwalls.jpg',

  /* ---------------- Waterproofing ---------------- */
  'Terrace Waterproofing': '/assets/icons/terrace.png',
  'Bathroom Waterproofing': '/assets/icons/bathroomwp.png',
  'Kitchen Waterproofing': '/assets/icons/Kitchenwp.png',
  'Balcony Waterproofing': '/assets/icons/balconywp.png',
  'Basement Waterproofing': '/assets/icons/basementwp.jpg',
  'Water Tank Waterproofing': '/assets/icons/water-tank.jpg',
  'External Waterproofing': '/assets/icons/externalwp.jpg',
  'Wall Waterproofing': '/assets/icons/wallwp.png',


  /* ---------------- POP Ceiling ---------------- */
  'POP Ceiling': '/assets/icons/ceiling.jpg',
  'Gypsum Ceiling': '/assets/icons/gypsum.png',
  'False Ceiling': '/assets/icons/falseceiling-bg.png',
  'Designer Ceiling': '/assets/icons/designerceiling.png',
  'Wall Moulding': '/assets/icons/wallmouldingpng.png',
  'Cornice': '/assets/icons/cornice.jpg',
  'Partition Work': '/assets/icons/partition.jpg',
  'LED Cove & Lighting': '/assets/icons/led.jpg',

  /* ---------------- Plumbing ---------------- */
  'Toilet Installation': '/assets/icons/toiletwp.jpg',
  'Bathroom Installation': '/assets/icons/bathromompb.png',
  'Tap & Faucet Installation': '/assets/icons/tap.jpg',
  'Basin & Sink': '/assets/icons/basink.jpg',
  'Drainage & Blackage': '/assets/icons/drainage.png',
  'Bathroomm Accessories': '/assets/icons/bath-accesserioes.jpg',
  'Water Tank Installation': '/assets/icons/water-tank.jpg',
  'Leakage Repair & Connections': '/assets/icons/leakage.jpg',

  /* ---------------- Electrical ---------------- */
  'Home Electrical Services': '/assets/icons/home-elec.jpg',
  'Fan Installation': '/assets/icons/fan.jpg',
  'Light Installation': '/assets/icons/light.jpg',
  'Switches & Sockets': '/assets/icons/switch.jpg',
  'DB & MCB Installation': '/assets/icons/mcb.jpg',
  'Electricial Repair': '/assets/icons/electrical.png',
  'Wiring & Rewiring': '/assets/icons/wiring.jpg',
  'Appliance Installation': '/assets/icons/appliance.jpg',

  /* ---------------- Other Services ---------------- */
  'Architectural & Design': '/assets/icons/architect.jpg',
  'Civil Construction': '/assets/icons/civil.jpg',
  'Furniture Work': '/assets/icons/furniture.jpg',
  'Fabrication': '/assets/icons/fabrication.jpg',
  'Finishing Work': '/assets/icons/finishing.jpg',
};

// We need a temporary fallback image. Let's create one.
const FALLBACK_SUBSERVICE_IMAGE = '/assets/icons/fallback.jpg';

function getSubserviceImage(name) {
  return SUBSERVICE_IMAGES[name] || FALLBACK_SUBSERVICE_IMAGE;
}
/* ============================================================
   HELPERS
   ============================================================ */
function routeFor(slug) {
  if (slug === 'interior-by-choice') return '/interior-by-choice';
  if (slug === 'electrical') return '/services/electrical';
  return `/services/${slug}`;
}

function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ============================================================
   IMAGES FOR RIGHT-SIDE COLLAGE
   ============================================================ */
const SERVICE_IMAGES = {
  'interior-design': [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
  ],
  painting: [
    'https://plus.unsplash.com/premium_photo-1681113076872-c74b8926e70c?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1664298827256-04eb817aa0ba?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1726812075913-af89b672932b?q=80&w=815&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ],
  plumbing: [
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800',
    'https://t4.ftcdn.net/jpg/02/20/20/41/240_F_220204174_vfgB0Vo2i4MZ8Sv5hmtsx5IwcvrDCZox.jpg',
    'https://trusteyman.com/wp-content/uploads/2019/02/how-does-plumbing-work-e1548696261445.jpeg',
  ],
  electrical: [
    'https://images.unsplash.com/photo-1683295083329-4d4738291f3a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1661911309991-cc81afcce97d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1661908782924-de673a5c6988?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ],
  'pop-ceiling-design': [
    'https://images.livspace-cdn.com/w:3840/plain/https://d3gq2merok8n5r.cloudfront.net/abhinav/ond-1634120396-Obfdc/di-2026-1769081758-Ayx2Q/amj-1774778677-BA1IA/false-ceiling-1775037704-53sHV/fc-9-1777449939-mlcBO.png',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80&w=800',
    'https://images.livspace-cdn.com/w:3840/plain/https://d3gq2merok8n5r.cloudfront.net/abhinav/ond-1634120396-Obfdc/di-2026-1769081758-Ayx2Q/amj-1774778677-BA1IA/false-ceiling-1775037704-53sHV/fc-7-1777449942-pNIOS.png',
  ],
  waterproofing: [
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
  ],
  'other-services': [
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&q=80&w=800',
  ],
};

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=800',
];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PopularServices() {
  const [categories, setCategories] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState('interior-design');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.services()
      .then((data) => {
        if (cancelled) return;
        const merged = [...data]
          .filter((item) => item.active !== false)
          .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
          .map((item) => {
            const localService = getServiceBySlug(item.slug);
            return {
              ...item,
              subServices: localService?.subServices || [],
              icon: item.icon || localService?.icon || 'settings',
            };
          });
        setCategories(merged);
        const interior = merged.find((item) => item.slug === 'interior-design');
        if (interior) setSelectedSlug('interior-design');
      })
      .catch((err) => {
        if (!cancelled) setError(friendlyError(err));
      });
    return () => { cancelled = true; };
  }, []);

  const selectedService = useMemo(() => {
    if (!categories) return null;
    return categories.find((service) => service.slug === selectedSlug) || null;
  }, [categories, selectedSlug]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!isTyping) return categories;
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((service) => service.name.toLowerCase().includes(query));
  }, [categories, search, isTyping]);

  function handleSelectService(service) {
    setSelectedSlug(service.slug);
    setSearch(service.name);
    setIsTyping(false);
    setSearchOpen(false);
  }

  const currentImages = SERVICE_IMAGES[selectedSlug] || DEFAULT_IMAGES;

  return (
    <section className="uc-section">
      <div className="uc-container">
        
        <div className="uc-header">
          <h2 className="uc-title">Home services at your doorstep</h2>
        </div>

        <div className="uc-main-grid">
          
          <div className="uc-left-col">
            
            <div className="uc-search-wrapper">
              <div className="uc-search-box">
                <Icon name="search" size={20} strokeWidth={1.6} />
                <input
                  type="text"
                  value={search}
                  placeholder="Search for a service"
                  onFocus={() => { setSearchOpen(true); setIsTyping(false); }}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setIsTyping(true);
                    setSearchOpen(true);
                  }}
                  aria-label="Search for a service"
                />
                <button
                  type="button"
                  className="uc-search-arrow"
                  onClick={() => { setSearchOpen(!searchOpen); setIsTyping(false); }}
                >
                  <Icon name="chevron-down" size={17} strokeWidth={1.5} />
                </button>
              </div>

              {searchOpen && (
                <div className="uc-dropdown">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((service) => (
                      <button
                        key={service.slug}
                        type="button"
                        className={`uc-dropdown-item ${selectedSlug === service.slug ? 'active' : ''}`}
                        onClick={() => handleSelectService(service)}
                      >
                        <span className="uc-dropdown-icon">
                          <Icon name={ICON_BY_SLUG[service.slug] || service.icon || 'settings'} size={21} strokeWidth={1.5} />
                        </span>
                        <span className="uc-dropdown-name">{service.name}</span>
                        {selectedSlug === service.slug && <Icon name="check" size={16} strokeWidth={1.7} />}
                      </button>
                    ))
                  ) : (
                    <div className="uc-no-result">No services found</div>
                  )}
                </div>
              )}
            </div>

            {/* --- SUB-SERVICES GRID --- */}
            {/* --- SUB-SERVICES GRID --- */}
{selectedService && (
  <div className="uc-subservices-container">
    <div className="uc-subservices-grid">
      {selectedService.subServices?.length > 0 ? (
        selectedService.subServices.map((subService) => (
          <Link
            key={subService.name}
            to={`${routeFor(selectedService.slug)}#${slugify(subService.name)}`}
            className="uc-subservice-card"
          >
            {/* IMAGE BOX */}
            {/* IMAGE BOX */}
<span className="uc-subservice-icon-box">
  <img 
    src={getSubserviceImage(subService.name)} 
    alt={subService.name} 
    loading="lazy"
    onError={(e) => {
      if (!e.target.src.includes('fallback.jpg')) {
        e.target.src = '/assets/icons/fallback.jpg';
      }
    }}
  />
</span>
            <span className="uc-subservice-name">{subService.name}</span>
          </Link>
        ))
      ) : (
        <Link to={routeFor(selectedService.slug)} className="uc-empty-service">
          <span>Explore {selectedService.name}</span>
          <Icon name="arrow-right" size={17} />
        </Link>
      )}
    </div>
    
    <div className="uc-view-all-wrapper">
      <Link to={routeFor(selectedService.slug)} className="uc-view-all-link">
        View all <Icon name="arrow-right" size={16} />
      </Link>
    </div>
  </div>
)}
          </div>

          <div className="uc-right-col">
            <div className="uc-image-collage">
              <div className="uc-img-wrapper uc-img-1">
                <img src={currentImages[0]} alt={selectedService?.name || 'Service'} loading="lazy" />
              </div>
              <div className="uc-img-wrapper uc-img-2">
                <img src={currentImages[1]} alt={selectedService?.name || 'Service'} loading="lazy" />
              </div>
              <div className="uc-img-wrapper uc-img-3">
                <img src={currentImages[2]} alt={selectedService?.name || 'Service'} loading="lazy" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}