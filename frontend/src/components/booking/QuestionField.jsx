import Icon from '../ui/Icon';

/**
 * ============================================================
 * WATERPROOFING SERVICE IMAGES
 * ============================================================
 */
const waterproofingImages = {
  'Terrace Waterproofing':
    '/assets/waterproofing/Terrace.png',

  'Bathroom Waterproofing':
    '/assets/waterproofing/bathroom.png',

  'Toilet Waterproofing':
    '/assets/waterproofing/toilet.png',

  'Balcony Waterproofing':
    '/assets/waterproofing/balcony.png',

  'Kitchen Waterproofing':
    '/assets/waterproofing/kitchen.png',

  'Basement Waterproofing':
    '/assets/waterproofing/basement.png',

  'Podium Waterproofing':
    '/assets/waterproofing/podium.png',

  'Wall Waterproofing':
    '/assets/waterproofing/wall.png',

  'External Waterproofing':
    '/assets/waterproofing/external.png',

  'Water Tank Waterproofing':
    '/assets/waterproofing/watertank.png',

  'Bathroom Wall Waterproofing':
    '/assets/waterproofing/bathroom.png',

  'Bathroom Corner & Joint Sealing':
    '/assets/waterproofing/bathroom joint.png',

  'Bathroom Shower Area Waterproofing':
    '/assets/waterproofing/Shower.png',

  'Bathroom Pipeline & Fixture Sealing':
    '/assets/waterproofing/Pipeline.png',

  'Bathroom Tile Re-sealing':
    '/assets/waterproofing/Re-sealing.png',
};

/**
 * ============================================================
 * PROPERTY TYPE IMAGES
 * ============================================================
 */
const propertyImages = {
  '1 BHK':
    '/assets/waterproofing/hero/one.png',

  '2 BHK':
    '/assets/waterproofing/hero/two.png',

  '3 BHK':
    '/assets/waterproofing/hero/three.png',

  '4 BHK+':
    '/assets/waterproofing/hero/modern-house.jpg',

  'Villa / Bungalow':
    '/assets/waterproofing/hero/Villa.png',

  'Office':
    '/assets/waterproofing/hero/office.png',

  'Shop':
    '/assets/waterproofing/hero/shop.png',

  'Commercial':
    '/assets/waterproofing/hero/commercial.png',

  'Building / Society':
    '/assets/waterproofing/hero/building.png',

  'Other':
    '/assets/waterproofing/hero/other.png',
};

/**
 * ============================================================
 * WATERPROOFING PROBLEM TYPE IMAGES
 * ============================================================
 */
const problemImages = {
  'Water leakage':
    '/assets/waterproofing/hero/water-leakage.png',

  'Dampness':
    '/assets/waterproofing/hero/Dampness.png',

  'Seepage':
    '/assets/waterproofing/hero/Seepage.png',

  'Cracks':
    '/assets/waterproofing/hero/Cracks.png',

  'Water coming through ceiling':
    '/assets/waterproofing/hero/WaterLeakage.png',

  'Water coming through wall':
    '/assets/waterproofing/hero/wall-Leakage.png',

  'Bathroom leakage':
    '/assets/waterproofing/hero/Bathroom.png',

  'Terrace leakage':
    '/assets/waterproofing/hero/Terrace-leakage.png',

  'Preventive waterproofing':
    '/assets/waterproofing/hero/Preventive-waterproofing.png',

  'Not sure':
    '/assets/waterproofing/hero/notsure.png',
};

/**
 * ============================================================
 * WATERPROOFING PROBLEM LOCATION IMAGES
 * ============================================================
 */
const problemLocationImages = {
  Terrace:
    '/assets/waterproofing/hero/terrace.png',

  Bathroom:
    '/assets/waterproofing/hero/bath.png',

  Toilet:
    '/assets/waterproofing/hero/toilet.png',

  Balcony:
    '/assets/waterproofing/hero/balcony.png',

  Kitchen:
    '/assets/waterproofing/hero/kitchen.png',

  Basement:
    '/assets/waterproofing/hero/basement.png',

  Wall:
    '/assets/waterproofing/hero/wall.png',

  Podium:
    '/assets/waterproofing/podium.png',

  'External area':
    '/assets/waterproofing/hero/area.png',

  Other:
    '/assets/waterproofing/hero/other1.png',
};

/**
 * ============================================================
 * QUESTION FIELD
 * ============================================================
 */
export default function QuestionField({
  question,
  value,
  onChange,
  error,
}) {
  const {
    key,
    text,
    inputType,
    required,
    options,
  } = question;

  const isMulti = inputType === 'MULTI';

  /**
   * Convert current value into an array.
   * Used for tile/check selections.
   */
  const selected = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  /**
   * Check whether an option is selected.
   */
  const isChosen = (optionValue) =>
    selected.includes(optionValue);

  /**
   * ==========================================================
   * TOGGLE / SELECT OPTION
   * ==========================================================
   */
  const toggle = (optionValue) => {
    /**
     * MULTI selection
     */
    if (isMulti) {
      onChange((prev) => {
        const list = Array.isArray(prev)
          ? prev
          : prev
            ? [prev]
            : [];

        if (list.includes(optionValue)) {
          return list.filter(
            (v) => v !== optionValue
          );
        }

        return [
          ...list,
          optionValue,
        ];
      });

      return;
    }

    /**
     * SINGLE selection
     */
    onChange(optionValue);
  };

  /**
   * ==========================================================
   * GROUP OPTIONS
   * ==========================================================
   */
  const groups = [];

  (options || []).forEach((option) => {
    const groupName = option.group || '';

    let group = groups.find(
      (g) => g.name === groupName
    );

    if (!group) {
      group = {
        name: groupName,
        items: [],
      };

      groups.push(group);
    }

    group.items.push(option);
  });

  /**
   * ==========================================================
   * GET OPTION IMAGE
   * ==========================================================
   */
  const getOptionImage = (option) => {
    if (key === 'property_type') {
      return (
        propertyImages[option.label] ||
        propertyImages[option.value]
      );
    }

    if (key === 'problem_type') {
      return (
        problemImages[option.label] ||
        problemImages[option.value]
      );
    }

    if (key === 'problem_location') {
      return (
        problemLocationImages[option.label] ||
        problemLocationImages[option.value]
      );
    }

    return (
      waterproofingImages[option.label] ||
      waterproofingImages[option.value]
    );
  };

  /**
   * ==========================================================
   * CHECK WHETHER QUESTION USES SIMPLE RADIO STYLE
   * ==========================================================
   *
   * Only these two questions use simple radio buttons:
   *
   * 1. previous_waterproofing
   * 2. previous_when
   *
   * Everything else keeps the tile/card UI.
   */
  const isSimpleRadioQuestion =
    key === 'previous_waterproofing' ||
    key === 'previous_when';

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */
  return (
    <fieldset className="question">

      {/* ======================================================
          QUESTION HEADER
      ====================================================== */}

      <legend className="sr-only">
        {text}
      </legend>

      <div className="wizard-card-head">
        <h2>
          {text}

          {required && (
            <span className="req">
              {' '}*
            </span>
          )}
        </h2>

        {isMulti && (
          <p>
            You can choose more than one.
          </p>
        )}
      </div>

      {/* ======================================================
          SINGLE / MULTI OPTIONS
      ====================================================== */}

      {(inputType === 'SINGLE' || isMulti) &&
        groups.map((group, groupIndex) => (

          <div
            key={`${group.name || 'ungrouped'}-${groupIndex}`}
            className="choice-group"
          >

            {/* ==================================================
                GROUP TITLE
            ================================================== */}

            {group.name && (
              <p className="choice-group-title">
                {group.name}
              </p>
            )}

            {/* ==================================================
                SIMPLE RADIO QUESTIONS
            ================================================== */}

            {isSimpleRadioQuestion && !isMulti ? (

              <div
                className={
                  key === 'previous_waterproofing'
                    ? 'waterproofing-radio-options'
                    : 'waterproofing-when-options'
                }
                role="radiogroup"
                aria-label={text}
              >

                {group.items.map(
                  (option, optionIndex) => (

                    <label
                      key={`${option.value}-${optionIndex}`}
                      className={
                        key === 'previous_waterproofing'
                          ? 'waterproofing-radio-option'
                          : 'waterproofing-when-option'
                      }
                    >

                      <input
                        type="radio"
                        name={key}
                        value={option.value}
                        checked={
                          String(value ?? '') ===
                          String(option.value)
                        }
                        onChange={(e) =>
                          onChange(e.target.value)
                        }
                      />

                      <span>
                        {option.label}
                      </span>

                    </label>

                  )
                )}

              </div>

            ) : (

              /* ==================================================
                 ALL OTHER QUESTIONS
                 KEEP EXISTING TILE DESIGN
              ================================================== */

              <div className="tile-grid">

                {group.items.map(
                  (option, optionIndex) => {

                    const image =
                      getOptionImage(option);

                    return (
                      <label
                        key={`${option.value}-${optionIndex}`}
                        className={`tile ${
                          key === 'property_type'
                            ? 'property-tile'
                            : key === 'problem_type'
                              ? 'problem-tile'
                              : key === 'problem_location'
                                ? 'problem-location-tile'
                                : ''
                        }`}
                      >

                        {/* ==================================================
                            RADIO / CHECKBOX
                        ================================================== */}

                        <input
                          type={
                            isMulti
                              ? 'checkbox'
                              : 'radio'
                          }
                          name={key}
                          value={option.value}
                          checked={isChosen(
                            option.value
                          )}
                          onChange={() =>
                            toggle(
                              option.value
                            )
                          }
                        />

                        {/* ==================================================
                            IMAGE
                        ================================================== */}

                        <span
                          className="tile-image"
                          aria-hidden="true"
                        >

                          {image ? (

                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                            />

                          ) : (

                            <span className="tile-icon-fallback">

                              <Icon
                                name={
                                  option.icon ||
                                  'tools'
                                }
                                size={17}
                                strokeWidth={1.7}
                              />

                            </span>

                          )}

                        </span>

                        {/* ==================================================
                            TEXT
                        ================================================== */}

                        <span className="tile-body">

                          <span className="tile-label">
                            {option.label}
                          </span>

                          {option.hint && (
                            <span className="tile-hint">
                              {option.hint}
                            </span>
                          )}

                        </span>

                        {/* ==================================================
                            CHECK ICON
                        ================================================== */}

                        <span
                          className="tile-check"
                          aria-hidden="true"
                        >

                          <Icon
                            name="check"
                            size={11}
                            strokeWidth={3.5}
                          />

                        </span>

                      </label>
                    );
                  }
                )}

              </div>

            )}

          </div>

        ))}

      {/* ======================================================
          NUMBER INPUT
      ====================================================== */}

      {inputType === 'NUMBER' && (
        <div className="field">

          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={value || ''}
            onChange={(e) =>
              onChange(e.target.value)
            }
            placeholder="e.g. 1200"
            aria-label={text}
          />

        </div>
      )}

      {/* ======================================================
          TEXT INPUT
      ====================================================== */}

      {inputType === 'TEXT' && (
        <div className="field">

          <textarea
            rows={4}
            value={value || ''}
            onChange={(e) =>
              onChange(e.target.value)
            }
            placeholder="Write in English, Hindi or Marathi — whatever is easiest."
            aria-label={text}
          />

        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <span className="field-error">
          {error}
        </span>
      )}

    </fieldset>
  );
}