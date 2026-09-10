import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { formatRupees } from '../../lib/money';

/** One consultation type — "Book →" opens the consultation booking flow
    directly for that type (not added to the item cart, matching the
    reference: consultation rows say "Book", not "Add +"). */
export default function ConsultationCard({ type }) {
  const navigate = useNavigate();
  const [minMins, maxMins] = (type.hint.split('|')[1] || '').split('-');

  return (
    <div className="plb-consult-card">
      <span className="plb-consult-icon" aria-hidden="true">
        <Icon name="chat" size={26} />
      </span>
      <div className="plb-consult-body">
        <strong>{type.label}</strong>
        <p>{type.hint.split('|')[0]}</p>
        <div className="plb-consult-meta">
          <span className="plb-consult-price">
            {formatRupees(type.price)} <em>(Adjustable in final bill)</em>
          </span>
          {minMins && maxMins && (
            <span className="plb-consult-duration">
              <Icon name="clock" size={14} /> {minMins}–{maxMins}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="plb-consult-book"
        onClick={() => navigate(`/services/plumbing/consultation/${type.value}`)}
      >
        Book <Icon name="arrow-right" size={15} />
      </button>
    </div>
  );
}
