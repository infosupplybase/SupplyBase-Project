import Icon from '../ui/Icon';

/**
 * Renders one booking question from the catalogue.
 *
 * The backend says what to ask and how; this decides what that looks like.
 * Deliberately almost no text fields — most customers answer on a phone, on
 * site, and tapping a card is far easier than typing a sentence in English
 * (spec §36).
 *
 *   SINGLE  cards, one choice      MULTI   cards, several choices
 *   NUMBER  a number box           TEXT    a textarea
 *   FILE    handled by the parent, which owns the file list
 */
export default function QuestionField({ question, value, onChange, error }) {
  const { key, text, inputType, required, options } = question;

  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const isChosen = (optionValue) => selected.includes(optionValue);

  /**
   * Toggling passes an UPDATER, not a value.
   *
   * Deriving the next answer from the `value` prop looks fine until two taps
   * land in one React batch — the second reads the pre-batch prop and wipes
   * the first. A fast double-tap on a phone does exactly that. Computing from
   * the previous state instead makes the order irrelevant.
   */
  const toggle = (optionValue) => {
    if (inputType === 'MULTI') {
      onChange((prev) => {
        const list = Array.isArray(prev) ? prev : prev ? [prev] : [];
        return list.includes(optionValue)
          ? list.filter((v) => v !== optionValue)
          : [...list, optionValue];
      });
    } else {
      // Tapping the chosen card again clears it, so an optional single-choice
      // question can be un-answered without reloading the page.
      onChange((prev) => (prev === optionValue ? '' : optionValue));
    }
  };

  /* Options can carry a group ("Painting" / "Waterproofing"). Preserve the
     order the backend sent rather than sorting — the catalogue decides it. */
  const groups = [];
  (options || []).forEach((option) => {
    const name = option.group || '';
    let group = groups.find((g) => g.name === name);
    if (!group) {
      group = { name, items: [] };
      groups.push(group);
    }
    group.items.push(option);
  });

  return (
    <div className={`question ${error ? 'has-error' : ''}`}>
      <h3 className="question-text" id={`q-${key}`}>
        {text}
        {required && <span className="req"> *</span>}
      </h3>

      {inputType === 'MULTI' && <p className="question-hint">You can choose more than one.</p>}

      {(inputType === 'SINGLE' || inputType === 'MULTI') &&
        groups.map((group) => (
          <div key={group.name || 'ungrouped'} className="option-group">
            {group.name && <p className="option-group-title">{group.name}</p>}
            <div
              className="option-grid"
              role={inputType === 'SINGLE' ? 'radiogroup' : 'group'}
              aria-labelledby={`q-${key}`}
            >
              {group.items.map((option) => {
                const chosen = isChosen(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role={inputType === 'SINGLE' ? 'radio' : 'checkbox'}
                    aria-checked={chosen}
                    className={`option-card ${chosen ? 'chosen' : ''}`}
                    onClick={() => toggle(option.value)}
                  >
                    <span className="option-mark" aria-hidden="true">
                      {chosen && <Icon name="check" size={14} strokeWidth={3} />}
                    </span>
                    <span className="option-body">
                      <span className="option-label">{option.label}</span>
                      {option.hint && <span className="option-hint">{option.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {inputType === 'NUMBER' && (
        <input
          type="number"
          min="1"
          inputMode="numeric"
          className="question-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 1200"
          aria-labelledby={`q-${key}`}
        />
      )}

      {inputType === 'TEXT' && (
        <textarea
          rows={4}
          className="question-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write in English, Hindi or Marathi — whatever is easiest."
          aria-labelledby={`q-${key}`}
        />
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
