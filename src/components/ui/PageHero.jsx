import Breadcrumbs from './Breadcrumbs';

/**
 * PageHero — the banner at the top of every inner page.
 *
 * Pass `accent` a service slug and the header takes that service's colour on
 * its top rule and eyebrow. Left off, the header stays neutral.
 */
export default function PageHero({ eyebrow, title, text, image, breadcrumbs = [], accent, children }) {
  return (
    <section className="page-hero" data-service={accent}>
      {image && (
        <div className="page-hero-bg">
          <img src={image} alt="" />
        </div>
      )}
      <div className="container">
        <div className="page-hero-inner">
          {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {text && <p>{text}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
