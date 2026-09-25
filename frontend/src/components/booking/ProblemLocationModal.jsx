import { useEffect } from 'react';
import Icon from '../ui/Icon';
import { problemLocationImages } from '../../data/waterproofingImages';

export default function ProblemLocationModal({ options, selected, onToggle, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="wp-problem-modal-overlay" onClick={onClose}>
      <div
        className="wp-problem-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wp-problem-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wp-problem-modal-head">
          <div>
            <p className="wp-problem-modal-eyebrow">Waterproofing</p>
            <h3 id="wp-problem-modal-title">Where is the problem?</h3>
            <p>Select all areas that need attention.</p>
          </div>
          <button type="button" className="wp-problem-modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={19} />
          </button>
        </div>

        <div className="wp-problem-modal-grid">
          {options.map((option) => {
            const image = problemLocationImages[option.value] || problemLocationImages[option.label];
            const isSelected = selected.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                className={`wp-problem-location-option ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggle(option.value)}
                aria-pressed={isSelected}
              >
                <span className="wp-problem-location-image">
                  {image ? <img loading="lazy" decoding="async" src={image} alt="" /> : <Icon name="droplet" size={28} />}
                </span>
                <span>{option.label}</span>
                {isSelected && <Icon name="check" size={16} strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="wp-problem-modal-foot">
          <span>{selected.length ? `${selected.length} selected` : 'No area selected'}</span>
          <button type="button" className="btn btn-primary" onClick={onClose}>DONE</button>
        </div>
      </div>
    </div>
  );
}