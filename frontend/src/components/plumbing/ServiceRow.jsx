import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';
import { useCart } from '../../context/CartContext';
import { ITEM_ICON_OVERRIDES } from '../../data/plumbingContent';

/**
 * One priced line item — thumbnail, name, description, price, and either an
 * "Add +" button or a live quantity stepper once it's in the cart. No
 * per-item photography exists (see plumbingContent.js's asset note), so the
 * thumbnail is a gold outline icon on the category's accent colour instead
 * of a fabricated or insufficient-quality photo.
 */
export default function ServiceRow({ item, group }) {
  const { quantityOf, addItem, updateQuantity } = useCart();
  const quantity = quantityOf(item.value);
  const icon = ITEM_ICON_OVERRIDES[item.value] || 'wrench';

  const handleAdd = () => {
    addItem({
      itemSlug: item.value,
      name: item.label,
      description: item.hint,
      group,
      unitPricePaise: Math.round(item.price * 100),
    });
  };

  return (
    <div className="plb-row">
      <span className="plb-row-thumb" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>

      <div className="plb-row-body">
        <span className="plb-row-name">{item.label}</span>
        <p className="plb-row-desc">{item.hint}</p>
        <div className="plb-row-price">
          {formatRupees(item.price)} <span>(Actual pricing)</span>
        </div>
      </div>

      {quantity > 0 ? (
        <div className="plb-qty" role="group" aria-label={`${item.label} quantity`}>
          <button type="button" onClick={() => updateQuantity(item.value, quantity - 1)} aria-label="Decrease quantity">
            −
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => updateQuantity(item.value, quantity + 1)} aria-label="Increase quantity">
            +
          </button>
        </div>
      ) : (
        <button type="button" className="plb-add-btn" onClick={handleAdd}>
          Add <Icon name="plus" size={15} />
        </button>
      )}
    </div>
  );
}
