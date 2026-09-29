import { useParams } from 'react-router-dom';
import PlumbingCheckout from './PlumbingCheckout';
import ElectricalTab from './ElectricalTab';
import ElectricianService from './ElectricianService';
import { getElectricalGroup } from '../data/electricalContent';

/** /services/electrical/checkout (and the pop-up's electrical checkout):
    the same cart checkout as plumbing, on the electrical cart. */
export default function ElectricalCheckout(props) {
  return <PlumbingCheckout trade="electrical" {...props} />;
}

/** /services/electrical/:subSlug — a cart category ("fan-services") opens
    its service list; any other slug is one of the detailed electrician
    journeys, which older links still point to. */
export function ElectricalSubPage() {
  const { subSlug } = useParams();
  return getElectricalGroup(subSlug) ? <ElectricalTab tabSlug={subSlug} /> : <ElectricianService />;
}
