import WhySupplybaseStats from '../stats/WhySupplybaseStats';

/**
 * StatsSection — kept as the name the pages already import.
 *
 * The design now lives in WhySupplybaseStats. Home, About and Projects all
 * render this same section, so pointing the old name at the new component
 * updates every one of them without editing three page files. `showHeading`
 * still works: /about passes false because it has its own headline.
 */
export default function StatsSection({ showHeading = true }) {
  return <WhySupplybaseStats showHeading={showHeading} />;
}
