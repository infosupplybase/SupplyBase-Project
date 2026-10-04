import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useCart } from '../context/CartContext';
import { formatRupees, formatItemPrice } from '../lib/money';

/** The electrical cart — in the booking pop-up, and at
    /services/electrical/cart. Only electrical items (see CartContext). */
export default function ElectricalCart({
  modal = false,
  onBackToServices,
  onCheckout,
}) {
  const navigate = useNavigate();
  const { items, count, subtotalPaise, updateQuantity, removeItem } = useCart('electrical');
  const backToServices = onBackToServices || (() => navigate('/services/electrical'));
  const checkout = onCheckout || (() => navigate('/services/electrical/checkout'));

  if (count === 0) {
    return (
      <section className="plb-section">
        <div className="container container-narrow plb-cart-empty">
          <Icon name="package" size={40} />
          <h1>Your cart is empty</h1>
          <p>Add an electrical service to get started.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={backToServices}
          >
            Browse Electrical Services
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={modal ? 'plb-section !py-0 !pb-4' : 'plb-section'}>
      <div className={modal ? 'container container-narrow !w-full !max-w-none !px-0' : 'container container-narrow'}>
        <div className="plb-cart-head">
          <button
            type="button"
            className="plb-back-link"
            onClick={backToServices}
          >
            <Icon name="arrow-left" size={18} />
            Continue browsing
          </button>

          <h1>
            Your Cart <span>({count} item{count > 1 ? 's' : ''})</span>
          </h1>
        </div>

        <div className="plb-list">
          {items.map((item) => (
            <div className="plb-row plb-cart-row" key={item.itemSlug}>
              <div className="plb-row-body">
                <span className="plb-row-name">{item.name}</span>
                <p className="plb-row-desc">{item.description}</p>
                <div className="plb-row-price">
                  {formatItemPrice(item.unitPricePaise / 100)}{' '}
                  <span>× {item.quantity}</span>
                </div>
              </div>

              <div className="plb-cart-row-actions">
                <div
                  className="plb-qty"
                  role="group"
                  aria-label={`${item.name} quantity`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.itemSlug, item.quantity - 1)
                    }
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.itemSlug, item.quantity + 1)
                    }
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>

                <span className="plb-cart-row-total">
                  {formatItemPrice(
                    (item.unitPricePaise * item.quantity) / 100
                  )}
                </span>

                <button
                  type="button"
                  className="plb-cart-row-remove"
                  onClick={() => removeItem(item.itemSlug)}
                  aria-label={`Remove ${item.name}`}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="plb-cart-summary">
          <div className="plb-cart-summary-row">
            <span>Subtotal</span>
            <strong>{formatRupees(subtotalPaise / 100)}</strong>
          </div>

          {/* Plumbing's "above ₹5,000" visit-fee rule is priced by the
              server for plumbing only, and electrician screens show no fee
              amounts — so no fee wording here. */}
          <p className="plb-cart-summary-note">
            Listed prices for your selected services. Our electrician confirms the final amount at the visit.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={checkout}
          >
            Proceed to Checkout
            <Icon name="arrow-right" size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
