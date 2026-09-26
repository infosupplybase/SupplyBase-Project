import Icon from '../ui/Icon';

/** The pale cream "Transparent Pricing" banner repeated on every plumbing
    page — real copy from the approved rate card, not screenshot text. */
export default function PricingBanner({ compact = false }) {
  return (
    <div className="plb-pricing-banner">
      <span className="plb-pricing-icon">
        <Icon name="rupee" size={22} />
      </span>
      <div>
        {!compact && <h3>Transparent Pricing</h3>}
        <p>
          Actual pricing for services up to ₹5,000.
          <br />
          For projects above ₹5,000, pay only ₹99 home visit fee
        </p>
        <span className="plb-pricing-note">(₹99 will be adjusted in your final bill if you proceed).</span>
      </div>
    </div>
  );
}
