import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { useCart } from '../context/CartContext';
import { formatRupees } from '../lib/money';

/** /services/plumbing/cart — real line items from CartContext, with working
    quantity controls and removal. Never shows the reference screenshot's
    hard-coded state; renders whatever is actually in the cart. */
export default function PlumbingCart() {
  const navigate = useNavigate();
  const { items, count, subtotalPaise, updateQuantity, removeItem } = useCart();

  if (count === 0) {
    return (
      <section className="plb-section">
        <div className="container container-narrow plb-cart-empty">
          <Icon name="package" size={40} />
          <h1>Your cart is empty</h1>
          <p>Add a service to get started.</p>
          <Link to="/services/plumbing" className="btn btn-primary">
            Browse Plumbing Services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="plb-section">
      <div className="container container-narrow">
        <div className="plb-cart-head">
          <Link to="/services/plumbing" className="plb-back-link">
            <Icon name="arrow-left" size={18} /> Continue browsing
          </Link>
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
                  {formatRupees(item.unitPricePaise / 100)} <span>× {item.quantity}</span>
                </div>
              </div>

              <div className="plb-cart-row-actions">
                <div className="plb-qty" role="group" aria-label={`${item.name} quantity`}>
                  <button type="button" onClick={() => updateQuantity(item.itemSlug, item.quantity - 1)} aria-label="Decrease quantity">
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.itemSlug, item.quantity + 1)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <span className="plb-cart-row-total">
                  {formatRupees((item.unitPricePaise * item.quantity) / 100)}
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
          <p className="plb-cart-summary-note">
            {subtotalPaise / 100 > 5000
              ? 'This is above ₹5,000 — a ₹99 home visit fee applies and is adjusted into your final bill.'
              : 'Actual pricing — no separate visit fee for this total.'}
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/services/plumbing/checkout')}>
            Proceed to Checkout <Icon name="arrow-right" size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
