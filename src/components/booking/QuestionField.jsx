import Icon from '../ui/Icon';

/**
 * Renders one booking question from the catalogue.
 *
 * The backend decides what to ask and how; this decides what that looks
 * like. Selectable tiles rather than a dropdown, because these forms are
 * filled in on a phone, often standing on site — tapping a card beats
 * opening a select and scrolling a list of seventeen options.
 *
 *   SINGLE  tiles, one choice       MULTI   tiles, several choices
 *   NUMBER  a number box            TEXT    a textarea
 *   FILE    handled by the parent, which owns the file list
 *
 * Each tile wraps a real radio or checkbox, hidden visually but present for
 * the keyboard and for screen readers. Selection shows as a gold border, a
 * pale gold fill AND a tick — never colour alone.
 */
export default function QuestionField({ question, value, onChange, error }) {
  const { key, text, inputType, required, options } = question;
  const isMulti = inputType === 'MULTI';

  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const isChosen = (optionValue) => selected.includes(optionValue);

  /*
   * Toggling passes an UPDATER, not a value.
   *
   * Deriving the next answer from the `value` prop looks correct until two
   * taps land in one React batch — the second reads the pre-batch prop and
   * wipes the first. A fast double-tap on a phone does exactly that.
   */
  const toggle = (optionValue) => {
    if (isMulti) {
      onChange((prev) => {
        const list = Array.isArray(prev) ? prev : prev ? [prev] : [];
        return list.includes(optionValue)
          ? list.filter((v) => v !== optionValue)
          : [...list, optionValue];
      });
    } else {
      onChange((prev) => (prev === optionValue ? '' : optionValue));
    }
  };

  /* Options may carry a group ("Painting" / "Waterproofing"). Keep the order
     the backend sent — the catalogue decides it, not this component. */
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
    <fieldset className="question">
      <legend className="sr-only">{text}</legend>

      <div className="wizard-card-head">
        <h2>
          {text}
          {required && <span className="req"> *</span>}
        </h2>
        {isMulti && <p>You can choose more than one.</p>}
      </div>

      {(inputType === 'SINGLE' || isMulti) &&
        groups.map((group) => (
          <div key={group.name || 'ungrouped'} className="choice-group">
            {group.name && <p className="choice-group-title">{group.name}</p>}
            <div className="tile-grid">
              {group.items.map((option) => (
                <label key={option.value} className="tile">
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={key}
                    value={option.value}
                    checked={isChosen(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  <span className="tile-icon" aria-hidden="true">
                    <Icon name={option.icon || 'tools'} size={17} strokeWidth={1.7} />
                  </span>
                  <span className="tile-body">
                    <span className="tile-label">{option.label}</span>
                    {option.hint && <span className="tile-hint">{option.hint}</span>}
                  </span>
                  <span className="tile-check" aria-hidden="true">
                    <Icon name="check" size={11} strokeWidth={3.5} />
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

      {inputType === 'NUMBER' && (
        <div className="field">
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. 1200"
            aria-label={text}
          />
        </div>
      )}

      {inputType === 'TEXT' && (
        <div className="field">
          <textarea
            rows={4}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write in English, Hindi or Marathi — whatever is easiest."
            aria-label={text}
          />
        </div>
      )}

      {error && <span className="field-error">{error}</span>}
    </fieldset>
  );
}
