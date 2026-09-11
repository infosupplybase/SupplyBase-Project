import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';
import { PRODUCT_GAP_MESSAGE } from '../../data/paintingContent';

const TIERS = ['Economy', 'Premium', 'Luxury'];

/**
 * Tier tabs + product list. Only Asian Paints has any priced product data
 * in the reference (see V15's gap notes) — Berger, and any tier without a
 * real transcribed price, shows an honest "ask us" state instead of an
 * invented product list.
 */
export default function ProductPicker({ productsByTier, brand, value, onSelect }) {
  const availableTiers = TIERS.filter((t) => (productsByTier.get(t) || []).length > 0);
  const [tab, setTab] = useState(availableTiers[0] || 'Premium');

  useEffect(() => {
    if (availableTiers.length && !availableTiers.includes(tab)) {
      setTab(availableTiers[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsByTier]);

  const products = brand === 'asian-paints' ? productsByTier.get(tab) || [] : [];

  return (
    <div className="pnt-product-picker">
      <div className="pnt-tabs" role="tablist">
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`pnt-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="pnt-product-gap">
          <Icon name="chat" size={22} />
          <p>{PRODUCT_GAP_MESSAGE}</p>
        </div>
      ) : (
        <div className="pnt-list">
          {products.map((p) => (
            <label key={p.value} className={`pnt-product ${value === p.value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paint_product"
                value={p.value}
                checked={value === p.value}
                onChange={() => onSelect(p.value)}
              />
              <span className="pnt-product-swatch" aria-hidden="true">
                <Icon name="package" size={22} />
              </span>
              <span className="pnt-product-body">
                <span className="pnt-product-label">{p.label}</span>
                <span className="pnt-product-hint">{p.hint}</span>
              </span>
              {p.price != null && (
                <span className="pnt-product-price">From {formatRupees(p.price)}</span>
              )}
              <span className="pnt-option-radio" aria-hidden="true" />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
