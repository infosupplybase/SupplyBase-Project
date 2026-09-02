import Link from 'next/link';
import Icon from '../ui/Icon';
import './ServiceCard.css';

/**
 * One service card from the approved design: photo left, copy right, black
 * BOOK NOW across the foot.
 *
 * The whole card is clickable and the button works on its own. Both are the
 * same real <Link>, so middle-click and "open in new tab" behave and a
 * screen reader announces one destination rather than two.
 */
export default function ServiceCard({ service }) {
  const {
    number, title, description, startingPrice, route,
    image, focus, alt, icon, badge,
  } = service;

  return (
    <article className="sc-card">
      <div className="sc-top">
        <div className="sc-media">
          <img
            src={image}
            alt={alt}
            style={{ objectPosition: focus }}
            loading="lazy"
            decoding="async"
          />
          <span className="sc-badge" data-badge={badge} aria-hidden="true">
            <Icon name={icon} size={19} strokeWidth={1.8} />
          </span>
        </div>

        <div className="sc-body">
          <h3 className="sc-title">
            <Link href={route}>
              {number}. {title}
            </Link>
          </h3>
          <p className="sc-desc">{description}</p>

          <p className="sc-price">
            <span className="sc-price-label">Starting from</span>
            <span className="sc-price-value">{startingPrice}</span>
          </p>
        </div>
      </div>

      <Link href={route} className="sc-book" aria-label={`Book ${title}`}>
        BOOK NOW
        <Icon name="arrow-right" size={15} />
      </Link>
    </article>
  );
}
