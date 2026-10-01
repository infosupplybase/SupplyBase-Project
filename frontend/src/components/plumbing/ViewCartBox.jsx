import Icon from '../ui/Icon';
import { useCart } from '../../context/CartContext';

/**
 * The "N items added · View Cart" box under a service list — plumbing's and
 * electrical's (`cart`), so both flows look the same. Shows nothing while
 * that cart is empty.
 */
export default function ViewCartBox({ cart = 'plumbing', onViewCart }) {
  const { items } = useCart(cart);
  if (items.length === 0) return null;

  return (
    <div className="plb-view-cart-box">
      <div className="plb-view-cart-info">
        <span className="plb-view-cart-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <em className="plb-view-cart-badge">{items.length}</em>
        </span>

        <div>
          <strong>{items.length === 1 ? '1 item added' : `${items.length} items added`}</strong>
          <span>Tap to review &amp; book</span>
        </div>
      </div>

      <button type="button" className="plb-view-cart-btn" onClick={onViewCart}>
        View Cart
        <Icon name="arrow-right" size={16} />
      </button>
    </div>
  );
}
