import { Link } from 'react-router-dom';
import ServiceSeoContent from '../components/services/ServiceSeoContent';
import PageHero from '../components/ui/PageHero';
import Icon from '../components/ui/Icon';
import { popFlows, POP_HERO_IMAGE } from '../data/popCeilingContent';

const choices = [
  {
    slug: 'full-home',
    description: 'Complete POP ceiling work for your entire home.',
  },
  {
    slug: 'room',
    description: 'Stylish POP ceiling work for one room.',
  },
];

export default function PopCeilingCategory({
  modal = false,
  onSelectFlow,
}) {
  return (
    <>
      {!modal && (
        <PageHero
          eyebrow="POP & GYPSUM"
          title="POP Ceiling & Design"
          text="Elegant ceilings. Beautiful spaces. Expert installation."
          image={POP_HERO_IMAGE}
          breadcrumbs={[
            { label: 'Services', to: '/services' },
            { label: 'POP Ceiling & Design' },
          ]}
        />
      )}

      <section
        className={modal ? 'plb-section !py-0 !pb-4' : 'plb-section'}
      >
        <div
          className={
            modal
              ? 'container container-narrow !w-full !max-w-none !px-0'
              : 'container container-narrow'
          }
        >
          {/* Two journeys: a pair of equal cards, not two cells of the
              three-column grid plumbing uses */}
          <div className="plb-overview-grid !grid-cols-2">
            {choices.map(({ slug, description }) => {
              const flow = popFlows[slug];

              const card = (
                <>
                  <span className="plb-overview-photo">
                    <img
                      src={flow.intro.image}
                      alt=""
                      width={200}
                      height={125}
                      loading="lazy"
                    />
                  </span>

                  <span className="plb-overview-name">
                    {flow.title}
                    <Icon name="chevron-right" size={16} />
                  </span>

                  <span
                    className="plb-overview-price-note"
                    style={{ paddingTop: 8 }}
                  >
                    {description}
                  </span>
                </>
              );

              return modal ? (
                <button
                  key={slug}
                  type="button"
                  className="plb-overview-card !w-full !text-left"
                  onClick={() => onSelectFlow(slug)}
                >
                  {card}
                </button>
              ) : (
                <Link
                  key={slug}
                  to={`/services/pop-ceiling-design/${slug}`}
                  className="plb-overview-card"
                >
                  {card}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {!modal && <ServiceSeoContent slug="pop-ceiling-design" />}
    </>
  );
}