import { useId, useState } from 'react';
import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';
import { PRODUCT_GAP_MESSAGE } from '../../data/paintingContent';

const TIERS = ['Economy', 'Premium'];

const BRAND_LOGOS = {
  'asian-paints': '/assets/materials/asian-paints.webp',
  berger: '/assets/materials/berger-paints.webp',
};

function ProductCard({ product, brand, name, selected, onSelect, hidePrices = false }) {
  const [failedLogo, setFailedLogo] = useState(null);
  const logo = BRAND_LOGOS[brand];
  const showLogo = Boolean(logo && failedLogo !== logo);

  return (
    <label
      className={`pnt-product ${selected ? 'selected' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
        padding: 14,
        border: selected
          ? '2px solid #d9a624'
          : '2px solid #e7e7e7',
        borderRadius: 12,
        background: selected ? '#fff9e9' : '#ffffff',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        name={name}
        value={product.value}
        checked={selected}
        onChange={() => onSelect(product.value)}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />

      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          flexShrink: 0,
          padding: 6,
          boxSizing: 'border-box',
          border: '1px solid #eeeeee',
          borderRadius: 10,
          background: '#ffffff',
        }}
      >
        {showLogo ? (
          <img
            src={logo}
            alt=""
            loading="lazy"
            onError={() => setFailedLogo(logo)}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <Icon name="roller" size={28} />
        )}
      </span>

      <span
        className="pnt-product-body"
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 5,
          minWidth: 0,
        }}
      >
        <strong
          className="pnt-product-label"
          style={{ lineHeight: 1.4 }}
        >
          {product.label}
        </strong>

        {product.hint && (
          <span className="pnt-product-hint">
            {product.hint}
          </span>
        )}

        {!hidePrices && product.price != null && (
          <span className="pnt-product-price">
            From {formatRupees(product.price)}
          </span>
        )}

        {selected && (
          <span
            style={{
              color: '#8a650b',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Selected
          </span>
        )}
      </span>

      <span
        className="pnt-option-radio"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      />
    </label>
  );
}

export default function ProductPicker({
  productsByTier,
  brand,
  value,
  onSelect,
  hidePrices = false,
  showAllProducts = false,
}) {
  const pickerId = useId();

  const availableTiers = TIERS.filter(
    (tier) => (productsByTier.get(tier) || []).length > 0
  );

  const selectedTier = availableTiers.find((tier) =>
    (productsByTier.get(tier) || []).some(
      (product) => product.value === value
    )
  );

  const defaultTier = selectedTier || availableTiers[0] || 'Premium';
  const [chosenTab, setChosenTab] = useState(null);
  const tab = chosenTab || defaultTier;

  const products = showAllProducts
    ? [...productsByTier.values()].flat()
    : productsByTier.get(tab) || [];

  return (
    <div className="pnt-product-picker">
      <p
        className="question-hint"
        style={{ marginBottom: 16 }}
      >
        Explore the ranges and choose your preferred paint product.
      </p>

      <div
        className="pnt-tabs"
        aria-label="Paint product ranges"
        style={{
          display: showAllProducts ? 'none' : 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
          padding: 5,
          borderRadius: 12,
          background: '#f4f4f4',
          marginBottom: 18,
        }}
      >
        {TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            aria-pressed={tab === tier}
            className={`pnt-tab ${tab === tier ? 'active' : ''}`}
            onClick={() => setChosenTab(tier)}
            style={{
              minWidth: 0,
              padding: '10px 4px',
              border: 0,
              borderRadius: 8,
              background: tab === tier ? '#ffffff' : 'transparent',
              color: tab === tier ? '#8a650b' : '#666666',
              fontWeight: tab === tier ? 700 : 500,
              cursor: 'pointer',
              boxShadow:
                tab === tier
                  ? '0 2px 6px rgba(0, 0, 0, 0.07)'
                  : 'none',
            }}
          >
            {tier}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div
          className="pnt-product-gap"
          style={{
            padding: 22,
            border: '1px dashed #dbc99a',
            borderRadius: 12,
            background: '#fffaf0',
            textAlign: 'center',
          }}
        >
          <span aria-hidden="true">
            <Icon name="chat" size={26} />
          </span>

          <h3 style={{ margin: '12px 0 8px' }}>
            Need help choosing a product?
          </h3>

          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {PRODUCT_GAP_MESSAGE}
          </p>
        </div>
      ) : (
        <div
          className="pnt-list"
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.value}
              product={product}
              brand={brand}
              name={`${pickerId}-product`}
              selected={value === product.value}
              hidePrices={hidePrices}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}