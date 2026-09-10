import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useCart } from '../../context/CartContext';
import { formatRupees } from '../../lib/money';

/**
 * The real cart bar — shows nothing when the cart is empty (the reference
 * screenshot's hard-coded "1 item added" state is never rendered here; count
 * and subtotal always reflect the actual CartContext state).
 */
export default function StickyCartBar() {
  const navigate = useNavigate();
  const { items, count, subtotalPaise } = useCart();

  if (count === 0) return null;

  const lastItem = items[items.length - 1];

  return (
    <div className="plb-cart-bar">
      <span className="plb-cart-bar-icon">
        <Icon name="package" size={20} />
        <span className="plb-cart-bar-badge">{count}</span>
      </span>
      <span className="plb-cart-bar-text">
        <strong>
          {count} item{count > 1 ? 's' : ''} added
        </strong>
        <span>
          {lastItem.name}
          {items.length > 1 ? ` +${items.length - 1} more` : ''} · {formatRupees(subtotalPaise / 100)}
        </span>
      </span>
      <button type="button" className="plb-cart-bar-btn" onClick={() => navigate('/services/plumbing/cart')}>
        View Cart <Icon name="arrow-right" size={16} />
      </button>
    </div>
  );
}
