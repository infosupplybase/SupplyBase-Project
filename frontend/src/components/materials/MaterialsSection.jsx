import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal';
import Icon from '../ui/Icon';
import { visibleBrands } from '../../data/materialBrands';
import './MaterialsSection.css';

/**
 * "We supply the material too" — the brand wall.
 *
 * Says that Supplybase buys and supplies the material as part of the job. It
 * deliberately asks the customer nothing: which supplier is used is decided by
 * the approved quotation, not by the customer picking from a grid.
 *
 * Brands come from data and are filtered and ordered by the same rules the
 * admin screen will use, so the API can replace the seed list without the
 * markup changing.
 */
export default function MaterialsSection() {
  const brands = visibleBrands();

  return (
    <section className="mb" aria-labelledby="materials-heading">
      <div className="mb-inner">
        <Reveal className="mb-head">
          <span className="mb-eyebrow">LABOUR + MATERIAL</span>
          <span className="mb-rule" aria-hidden="true" />
          <h2 id="materials-heading" className="mb-heading">
            WE SUPPLY THE <span className="mb-heading-gold">MATERIAL TOO</span>
          </h2>
          <p className="mb-lead">
            Branded materials bought at project rates and itemised in your quotation, so you can see
            exactly what you are paying for.
          </p>
        </Reveal>

        <Reveal as="ul" className="mb-grid" delay={80}>
          {brands.map((brand) => (
            <li key={brand.id} className="mb-item">
              <div
  className="
    mb-card
    !bg-white/55
    backdrop-blur-xl
    !border !border-white/40
    !shadow-[0_8px_24px_rgba(0,0,0,0.08)]
  "
>
                {/* The logo carries the brand name already, so it is decorative
                    here — the caption below is the accessible text. Giving the
                    image its own alt would make a screen reader say every name
                    twice. */}
                <img src={brand.logo} alt="" loading="lazy" decoding="async" />
              </div>
              <span className="mb-name">{brand.name}</span>
            </li>
          ))}
        </Reveal>

        <div className="mb-actions">
          <Link to="/materials" className="mb-cta">
            SEE ALL MATERIALS
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
