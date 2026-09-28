import { useState } from 'react';
import '../styles/InteriorDesignCustomFlow.css';

export default function InteriorDesignCustomFlow({
  onBack,
  onContinue,
}) {
  const [requirements, setRequirements] = useState('');
  const [error, setError] = useState('');

  const MAX_LENGTH = 400;
  const MIN_LENGTH = 10;

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
      <div className="id-custom-content">
        <h2>Tell us about your requirements</h2>

        <textarea
          rows={8}
          placeholder="Tell us about your interior design requirements..."
          className="id-custom-textarea"
          value={requirements}
          maxLength={MAX_LENGTH}
          onChange={(e) => {
            setRequirements(e.target.value);

            if (error) {
              setError('');
            }
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '6px',
          }}
        >
          {error ? (
            <p
              style={{
                color: '#d32f2f',
                fontSize: '13px',
                margin: 0,
              }}
            >
              {error}
            </p>
          ) : (
            <span />
          )}

          <span
            style={{
              color: '#777',
              fontSize: '12px',
              marginLeft: 'auto',
            }}
          >
            {requirements.length} / {MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="id-custom-footer">
        <button
          type="button"
          className="id-custom-back"
          onClick={onBack}
        >
          BACK
        </button>

        <button
          type="button"
          className="id-custom-continue"
          onClick={handleContinue}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}