import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';
import { useCart } from '../../context/CartContext';
import { ITEM_ICON_OVERRIDES, ITEM_IMAGES } from '../../data/plumbingContent';

/**
 * Shared service row.
 *
 * Electrical services can provide their own `item.image`.
 * Plumbing continues using ITEM_IMAGES from plumbingContent.js.
 */
export default function ServiceRow({ item, group }) {
  const { quantityOf, addItem, updateQuantity } = useCart();

  const quantity = quantityOf(item.value);

  // Electrical items use item.image.
  // Plumbing keeps using its existing ITEM_IMAGES mapping.
  const image = item.image || ITEM_IMAGES[item.value];

  const icon =
    ITEM_ICON_OVERRIDES[item.value] || 'wrench';

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

      {/* SERVICE IMAGE */}
      <span className="plb-row-thumb" aria-hidden="true">
        {image ? (
          <img
            loading="lazy"
            decoding="async"
            src={image}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <Icon name={icon} size={26} />
        )}
      </span>

      {/* SERVICE DETAILS */}
      <div className="plb-row-body">
        <span className="plb-row-name">
          {item.label}
        </span>

        <p className="plb-row-desc">
          {item.hint}
        </p>

        <div className="plb-row-price">
          {formatRupees(item.price)}
          <span> (Actual pricing)</span>
        </div>
      </div>

      {/* CART QUANTITY / ADD BUTTON */}
      {quantity > 0 ? (
        <div
          className="plb-qty"
          role="group"
          aria-label={`${item.label} quantity`}
        >
          <button
            type="button"
            onClick={() =>
              updateQuantity(item.value, quantity - 1)
            }
            aria-label={`Decrease ${item.label} quantity`}
          >
            −
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            onClick={() =>
              updateQuantity(item.value, quantity + 1)
            }
            aria-label={`Increase ${item.label} quantity`}
          >
            +
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="plb-add-btn"
          onClick={handleAdd}
        >
          Add
          <Icon name="plus" size={15} />
        </button>
      )}

    </div>
  );
}