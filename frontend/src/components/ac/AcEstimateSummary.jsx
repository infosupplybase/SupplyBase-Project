import {
  acTypes,
  acCapacities,
  acRefrigerants,
  acServicesByCategory,
  acAddonsByCategory,
} from '../../data/acContent';
import { formatRupees } from '../../lib/money';

export default function AcEstimateSummary({ selection, visitFee }) {
  const service = (acServicesByCategory[selection.category] || [])
    .find((item) => item.value === selection.service);

  const units = Number(selection.units);
  const validUnits = Number.isInteger(units) && units > 0;
  const unitCount = validUnits ? units : 1;

  const addons = (acAddonsByCategory[selection.category] || [])
    .filter((item) => selection.addons?.includes(item.value))
    .map((item) => {
      const quantity = item.unit
        ? Number(selection.addonQuantities?.[item.value] ?? 1)
        : 1;

      return {
        ...item,
        quantity,
        amount: Number(item.price || 0) * quantity,
      };
    });

  const hasPrice = service?.price != null && validUnits;
  const serviceAmount = hasPrice
    ? Number(service.price) * unitCount
    : null;

  const addonAmount = addons.reduce((total, item) => total + item.amount, 0);
  const total = hasPrice ? serviceAmount + addonAmount : null;

  const type = acTypes.find((item) => item.value === selection.acType);
  const capacity = acCapacities.find((item) => item.value === selection.capacity);
  const refrigerant = acRefrigerants.find((item) => item.value === selection.refrigerant);

  return (
    <div className="ac-estimate">
      <div className="ac-estimate-selection">
        <strong>{service?.label || 'AC service'}</strong>
        <span>
          {[type?.label, `${unitCount} AC unit${unitCount > 1 ? 's' : ''}`,
            selection.category === 'installation' ? capacity?.label : null,
            selection.category === 'gas-charging' ? refrigerant?.label : null,
          ].filter(Boolean).join(' · ')}
        </span>
      </div>

      <div className="ac-estimate-row">
        <span>
          {service?.inspection ? 'Starting inspection estimate' : 'Starting service estimate'}
          {hasPrice && (
            <small>{formatRupees(service.price)} × {unitCount} AC unit(s)</small>
          )}
        </span>
        <strong>{hasPrice ? formatRupees(serviceAmount) : 'To be confirmed'}</strong>
      </div>

      {addons.map((item) => (
        <div className="ac-estimate-row" key={item.value}>
          <span>
            {item.label}
            {item.unit && <small>{item.quantity} {item.unit}</small>}
          </span>
          <strong>{formatRupees(item.amount)}</strong>
        </div>
      ))}

      {addons.length === 0 && (
        <p className="ac-estimate-note">No additional services selected.</p>
      )}

      <div className="ac-estimate-total">
        <span>Starting estimate</span>
        <strong>{total != null ? formatRupees(total) : 'To be confirmed'}</strong>
      </div>

      <div className="ac-estimate-row ac-estimate-visit">
        <span>Visit fee · shown separately</span>
        <strong>
          {visitFee != null ? formatRupees(visitFee) : 'Loading…'}
        </strong>
      </div>

      <p className="ac-estimate-note">
        This preview uses the starting rate for each AC unit. Add-ons are counted
        once per booking, or by the length/quantity entered.
        The technician will confirm the applicable rate and final quote before work begins.
        {service?.inspection && ' Repair labour and replacement parts are not included.'}
        {selection.category === 'installation' &&
          selection.acType !== 'split' &&
          ' The displayed installation rate is a Split AC reference; your AC type may cost differently.'}
      </p>
    </div>
  );
}