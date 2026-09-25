import { useState } from 'react';
import Icon from '../ui/Icon';
import ProblemLocationModal from './ProblemLocationModal';

import {
  waterproofingImages,
  propertyImages,
  problemImages,
  problemLocationImages,
} from '../../data/waterproofingImages';

import {
  popHomeTypeImages,
  popRoomTypeImages,
  popDesignStyleImages,
  popAddonImages,
  popCeilingImages,
} from '../../data/popCeilingImages';

import {
  electricianImages,
  electricianPropertyImages,
  electricianLocationImages,
  electricianIssueImages,
  electricianLoadImages,
  electricianUrgencyImages,
  electricianRequirementImages,
} from '../../data/electricianImages';

import {
  architecturalImages,
  architecturalPropertyImages,
  architecturalProjectStatusImages,
} from '../../data/architecturalImages';

import {
  civilConstructionImages,
  civilConstructionPropertyImages,
  civilConstructionProjectStageImages,
} from '../../data/civilConstructionImages';

import {
  furnitureImages,
  furniturePropertyImages,
  furnitureMaterialImages,
} from '../../data/furnitureImages';

import {
  fabricationImages,
  fabricationPropertyImages,
  fabricationMaterialImages,
} from '../../data/fabricationImages';

import {
  finishingImages,
  finishingPropertyImages,
} from '../../data/finishingImages';

export default function QuestionField({
  question,
  value,
  onChange,
  error,
  serviceSlug,
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
   * ==========================================================
   * SELECTED VALUES
   * ==========================================================
   */

  const selected = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const isChosen = (optionValue) =>
    selected.includes(optionValue);

  /**
   * ==========================================================
   * TOGGLE / SELECT OPTION
   * ==========================================================
   */

  const toggle = (optionValue) => {
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

        return [...list, optionValue];
      });

      return;
    }

    onChange(optionValue);
  };

  /**
   * ==========================================================
   * GROUP OPTIONS
   * ==========================================================
   */

  const groups = [];
  const seenOptions = new Set();

  (options || []).forEach((option) => {
    const uniqueKey = `${option.group || ''}::${option.value ?? ''}::${option.label ?? ''}`;

    if (seenOptions.has(uniqueKey)) {
      return;
    }

    seenOptions.add(uniqueKey);

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
   * HELPER
   * ==========================================================
   *
   * Try both option.value and option.label.
   * This is important because catalogue values can be different
   * from the displayed labels.
   */

  const findImage = (imageMap, option) => {
    if (!imageMap || !option) {
      return undefined;
    }

    const normalizeKey = (value) =>
      String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const direct = imageMap[option.value] || imageMap[option.label];
    if (direct) return direct;

    const normalizedMap = Object.fromEntries(
      Object.entries(imageMap).map(([key, value]) => [normalizeKey(key), value])
    );

    return (
      normalizedMap[normalizeKey(option.value)] ||
      normalizedMap[normalizeKey(option.label)]
    );
  };

  /**
   * ==========================================================
   * GET OPTION IMAGE
   * ==========================================================
   */

  const getOptionImage = (option) => {
    /**
     * ========================================================
     * OTHER SERVICES — architectural design, civil construction,
     * furniture, fabrication, finishing. Each has a property-type
     * set, then either a stage set (architectural / civil) or a
     * material set (furniture / fabrication), then a service set.
     * ========================================================
     */

    const isPropertyKey =
      key === 'property_type' ||
      key === 'home_type' ||
      key === 'bhk';

    const isStageKey =
      key === 'project_stage' ||
      key === 'construction_stage' ||
      key === 'construction_status' ||
      key === 'project_status';

    const isMaterialKey =
      key === 'material_preference' ||
      key === 'material_type' ||
      key === 'preferred_material' ||
      key === 'material';

    if (serviceSlug === 'architectural-design') {
      if (isPropertyKey) {
        return findImage(architecturalPropertyImages, option);
      }

      if (isStageKey) {
        return findImage(architecturalProjectStatusImages, option);
      }

      return findImage(architecturalImages, option);
    }

    if (serviceSlug === 'civil-construction') {
      if (isPropertyKey) {
        return findImage(civilConstructionPropertyImages, option);
      }

      if (isStageKey) {
        return findImage(civilConstructionProjectStageImages, option);
      }

      return findImage(civilConstructionImages, option);
    }

    if (serviceSlug === 'furniture') {
      if (isPropertyKey) {
        return findImage(furniturePropertyImages, option);
      }

      if (isMaterialKey) {
        return findImage(furnitureMaterialImages, option);
      }

      return findImage(furnitureImages, option);
    }

    if (serviceSlug === 'fabrication') {
      if (isPropertyKey) {
        return findImage(fabricationPropertyImages, option);
      }

      if (isMaterialKey) {
        return findImage(fabricationMaterialImages, option);
      }

      return findImage(fabricationImages, option);
    }

    if (serviceSlug === 'finishing') {
      if (isPropertyKey) {
        return findImage(finishingPropertyImages, option);
      }

      return findImage(finishingImages, option);
    }

    /**
     * ========================================================
     * WATERPROOFING
     * ========================================================
     */

    if (
      serviceSlug === 'waterproofing' ||
      serviceSlug === 'water-proofing'
    ) {
      if (key === 'property_type') {
        return findImage(
          propertyImages,
          option
        );
      }

      if (key === 'problem_type') {
        return findImage(
          problemImages,
          option
        );
      }

      if (key === 'problem_location') {
        return findImage(
          problemLocationImages,
          option
        );
      }

      return findImage(
        waterproofingImages,
        option
      );
    }

    /**
     * ========================================================
     * POP CEILING & DESIGN
     * ========================================================
     */

    if (
      serviceSlug === 'pop-ceiling-design' ||
      serviceSlug === 'pop_ceiling_design' ||
      serviceSlug === 'pop-false-ceiling'
    ) {
      /**
       * POP HOME TYPE
       */

      if (
        key === 'pop_home_type' ||
        key === 'home_type' ||
        key === 'property_type'
      ) {
        return findImage(
          popHomeTypeImages,
          option
        );
      }

      if (key === 'service_needed') {
        return findImage(
          popCeilingImages,
          option
        );
      }

      /**
       * POP ROOM TYPE
       */

      if (
        key === 'pop_room_type' ||
        key === 'room_type' ||
        key === 'rooms'
      ) {
        return findImage(
          popRoomTypeImages,
          option
        );
      }

      /**
       * POP DESIGN STYLE
       */

      if (
        key === 'pop_design_style' ||
        key === 'design_style' ||
        key === 'pop_home_design_style' ||
        key === 'pop_room_design_style'
      ) {
        return findImage(
          popDesignStyleImages,
          option
        );
      }

      /**
       * POP ADD-ON
       */

      if (
        key === 'pop_addon' ||
        key === 'addon'
      ) {
        return findImage(
          popAddonImages,
          option
        );
      }
    }

    /**
     * ========================================================
     * ELECTRICIAN
     * ========================================================
     */

    if (
      serviceSlug === 'electrician' ||
      serviceSlug === 'electrical-services' ||
      serviceSlug === 'electrical'
    ) {
      if (key === 'service_needed') {
        return findImage(
          electricianImages,
          option
        );
      }

      if (key === 'property_type') {
        return findImage(
          electricianPropertyImages,
          option
        );
      }

      if (key === 'service_location') {
        return findImage(
          electricianLocationImages,
          option
        );
      }

      if (key === 'current_issue') {
        return findImage(
          electricianIssueImages,
          option
        );
      }

      if (key === 'load_requirement') {
        return findImage(
          electricianLoadImages,
          option
        );
      }

      if (key === 'urgency') {
        return findImage(
          electricianUrgencyImages,
          option
        );
      }

      if (key === 'requirement_type') {
        return findImage(
          electricianRequirementImages,
          option
        );
      }
    }

    return undefined;
  };

  /**
   * ==========================================================
   * SIMPLE RADIO QUESTIONS
   * ==========================================================
   */

  const isSimpleRadioQuestion =
    key === 'previous_waterproofing' ||
    key === 'previous_when';

  const [isProblemLocationOpen, setProblemLocationOpen] = useState(false);

  if (key === 'problem_location') {
    return (
      <fieldset className="question">
        <legend className="sr-only">{text}</legend>
        <div className="wizard-card-head">
          <h2>{text}{required && <span className="req"> *</span>}</h2>
          <p>Select one or more areas where you notice the issue.</p>
        </div>
        <button
          type="button"
          className={`wp-problem-location-trigger ${selected.length ? 'has-selection' : ''}`}
          onClick={() => setProblemLocationOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="wp-problem-location-trigger-icon"><Icon name="map-pin" size={23} /></span>
          <span>
            <strong>{selected.length ? `${selected.length} area${selected.length === 1 ? '' : 's'} selected` : 'Choose the affected area'}</strong>
            <small>{selected.length ? selected.join(', ') : 'Tap to select from the list'}</small>
          </span>
          <Icon name="chevron-right" size={18} />
        </button>
        {error && <span className="field-error">{error}</span>}
        {isProblemLocationOpen && (
          <ProblemLocationModal
            options={options || []}
            selected={selected}
            onToggle={toggle}
            onClose={() => setProblemLocationOpen(false)}
          />
        )}
      </fieldset>
    );
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <fieldset className="question">

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
                 TILE / CARD OPTIONS
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

                        {/* RADIO / CHECKBOX */}

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

                        {/* IMAGE */}

                        <span
                          className="tile-image"
                          aria-hidden="true"
                        >

                          {image ? (

                            <img
                              src={image}
                              alt=""
                              loading="eager"
                              decoding="async"
                              onError={(e) => {
                                console.error(
                                  'POP/WATERPROOFING IMAGE NOT FOUND:',
                                  image
                                );

                                e.currentTarget.style.display =
                                  'none';
                                e.currentTarget.parentElement.classList.add(
                                  'has-image-error'
                                );
                              }}
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

                        {/* TEXT */}

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

                        {/* CHECK ICON */}

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
      ======================================================
      */}

      {error && (
        <span className="field-error">
          {error}
        </span>
      )}

    </fieldset>
  );
}