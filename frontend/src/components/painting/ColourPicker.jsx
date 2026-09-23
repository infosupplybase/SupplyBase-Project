import { useState } from 'react';
import Icon from '../ui/Icon';
import { COLOUR_TABS } from '../../data/paintingContent';

/**
 * Swatch-grid colour picker. Preview colours come from the catalogue's own
 * option.hint (an approximate hex sampled from the reference's screenshots,
 * not an official manufacturer shade code — see V15's comment on this) and
 * "View Colour Gallery" opens the full swatch set across every tab at once,
 * a real working control rather than a dead link.
 */
export default function ColourPicker({ coloursByTab, tabSet, value, onSelect }) {
  const tabs = (COLOUR_TABS[tabSet] || COLOUR_TABS.standard).filter(
    (t) => (coloursByTab.get(t) || []).length > 0
  );
  const [tab, setTab] = useState(tabs[0]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const activeTab = tabs.includes(tab) ? tab : tabs[0];
  const swatches = coloursByTab.get(activeTab) || [];
  const selected = [...coloursByTab.values()].flat().find((c) => c.value === value);

  return (
    <div className="pnt-colour-picker">
      <div className="pnt-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={activeTab === t}
            className={`pnt-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="pnt-swatch-grid">
        {swatches.map((c) => (
          <label key={c.value} className={`pnt-swatch ${value === c.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="colour"
              value={c.value}
              checked={value === c.value}
              onChange={() => onSelect(c.value)}
            />
            <span className="pnt-swatch-chip" style={{ background: c.hex }} aria-hidden="true">
              {value === c.value && <Icon name="check" size={16} strokeWidth={3} />}
            </span>
            <span className="pnt-swatch-name">{c.label}</span>
          </label>
        ))}
      </div>

      <button type="button" className="pnt-gallery-link" onClick={() => setGalleryOpen(true)}>
        <Icon name="palette" size={17} />
        View Colour Gallery
        <Icon name="chevron-right" size={15} />
      </button>

      <p className="pnt-colour-disclaimer">
        Screen colours are approximate previews — actual paint may differ. Our team will show you
        real shade cards during your home visit.
      </p>

      {selected && (
        <div className="pnt-colour-selected">
          <span className="pnt-swatch-chip" style={{ background: selected.hex }} aria-hidden="true" />
          <span>
            Selected: <strong>{selected.label}</strong>
          </span>
        </div>
      )}

      {galleryOpen && (
        <div className="pnt-modal-overlay" onClick={() => setGalleryOpen(false)}>
          <div className="pnt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pnt-modal-head">
              <h3>Colour Gallery</h3>
              <button type="button" onClick={() => setGalleryOpen(false)} aria-label="Close">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="pnt-modal-body">
              {tabs.map((t) => (
                <div key={t} className="pnt-gallery-group">
                  <h4>{t}</h4>
                  <div className="pnt-swatch-grid">
                    {(coloursByTab.get(t) || []).map((c) => (
                      <label key={c.value} className={`pnt-swatch ${value === c.value ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="colour"
                          value={c.value}
                          checked={value === c.value}
                          onChange={() => {
                            onSelect(c.value);
                            setTab(t);
                            setGalleryOpen(false);
                          }}
                        />
                        <span className="pnt-swatch-chip" style={{ background: c.hex }} aria-hidden="true">
                          {value === c.value && <Icon name="check" size={16} strokeWidth={3} />}
                        </span>
                        <span className="pnt-swatch-name">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
