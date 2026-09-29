import { useState } from 'react';
import Icon from '../components/ui/Icon';
import ModalFoot from '../components/services/ModalFoot';
import '../styles/InteriorDesignCustomFlow.css';

const MAX_LENGTH = 400;
const MIN_LENGTH = 10;

/**
 * Interior Design -> "Custom": the customer describes what they want in their
 * own words, then goes to the usual details and schedule steps
 * (InteriorDesignFlow with startAtDetails), which books those requirements.
 * Drawn like every other booking step: the card heading, a normal form
 * field, and Back / Continue in the pop-up's footer bar (ModalFoot).
 */
export default function InteriorDesignCustomFlow({
  initialRequirements = '',
  onDraftChange,
  onBack,
  onContinue,
}) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [error, setError] = useState('');

  const handleContinue = () => {
    const value = requirements.trim();

    if (!value) {
      setError('Please tell us about your requirements.');
      return;
    }

    if (value.length < MIN_LENGTH) {
      setError(`Please enter at least ${MIN_LENGTH} characters.`);
      return;
    }

    setError('');
    onContinue(value);
  };

  return (
    <div className="id-custom-flow">
      <div className="wizard-card-head">
        <h2>Tell Us About Your Requirements</h2>
        <p>
          Rooms, style, budget, anything you have in mind — our designer will
          call you to discuss it.
        </p>
      </div>

      <div className={`field ${error ? 'error' : ''}`}>
        <label htmlFor="id-custom-requirements">
          Your requirements <span className="req">*</span>
        </label>

        <textarea
          id="id-custom-requirements"
          rows={7}
          placeholder="E.g. modular kitchen and wardrobes for a 2 BHK in Thane, modern style, warm lighting…"
          value={requirements}
          maxLength={MAX_LENGTH}
          onChange={(e) => {
            setRequirements(e.target.value);
            onDraftChange?.(e.target.value);

            if (error) {
              setError('');
            }
          }}
        />

        <div className="id-custom-meta">
          {error ? <span className="field-error">{error}</span> : <span />}

          <span className="id-custom-count">
            {requirements.length} / {MAX_LENGTH}
          </span>
        </div>
      </div>

      <ModalFoot className="wizard-foot modal-sticky-foot !grid !w-full !grid-cols-2 !gap-3 !border-0">
        <button
          type="button"
          className="btn btn-ghost btn-back !m-0 !w-full !justify-center"
          onClick={onBack}
        >
          BACK
        </button>

        <button
          type="button"
          className="btn btn-primary !m-0 !w-full !min-w-0 !flex !justify-center"
          onClick={handleContinue}
        >
          CONTINUE
          <Icon name="arrow-right" size={17} />
        </button>
      </ModalFoot>
    </div>
  );
}