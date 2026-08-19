import Breadcrumbs from './Breadcrumbs';

/**
 * PageHero — the dark banner used at the top of every inner page.
 */
export default function PageHero({ eyebrow, title, text, image, breadcrumbs = [], children }) {
  return (
    <section className="page-hero">
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
