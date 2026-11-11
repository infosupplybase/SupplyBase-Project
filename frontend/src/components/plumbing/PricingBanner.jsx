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
          Actual pricing for every listed service.
          <br />
          A ₹99 visiting fee, paid online when you book, confirms your visit
        </p>
        <span className="plb-pricing-note">(₹99 is adjusted in your final bill if you proceed).</span>
      </div>
    </div>
  );
}
