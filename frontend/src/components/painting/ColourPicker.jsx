import { useId, useState } from 'react';
import Icon from '../ui/Icon';
import { COLOUR_TABS } from '../../data/paintingContent';

function previewColour(colour) {
  const hex = colour.hex || colour.hint || '';

  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim())
    ? hex.trim()
    : '#E5E5E5';
}

function ColourCard({ colour, selected, name, onSelect }) {
  return (
    <label
      className={`pnt-swatch ${selected ? 'selected' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 0,
        minWidth: 0,
        padding: 5,
        overflow: 'hidden',
        border: selected
          ? '2px solid #d9a624'
          : '2px solid #e7e7e7',
        borderRadius: 12,
        background: selected ? '#fff9e9' : '#ffffff',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        name={name}
        value={colour.value}
        checked={selected}
        onChange={() => onSelect(colour.value)}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />

      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          height: 76,
          borderRadius: 8,
          backgroundColor: previewColour(colour),
          boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {selected && (
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#ffffff',
              color: '#80600d',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Icon name="check" size={15} strokeWidth={3} />
          </span>
        )}
      </span>

      <span
        className="pnt-swatch-name"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 42,
          padding: '7px 3px',
          boxSizing: 'border-box',
          color: '#292929',
          fontSize: 12,
          fontWeight: selected ? 700 : 500,
          lineHeight: 1.4,
          textAlign: 'center',
          overflowWrap: 'anywhere',
        }}
      >
        {colour.label}
      </span>
    </label>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
  gap: 10,
};

export default function ColourPicker({
  coloursByTab,
  tabSet,
  value,
  onSelect,
}) {
  const pickerId = useId();
  const [tab, setTab] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const preferredTabs = COLOUR_TABS[tabSet] || COLOUR_TABS.standard;

  const tabs = [
    ...preferredTabs,
    ...[...coloursByTab.keys()].filter(
      (group) => !preferredTabs.includes(group)
    ),
  ].filter((group) => (coloursByTab.get(group) || []).length > 0);

  const activeTab = tabs.includes(tab) ? tab : tabs[0];
  const swatches = coloursByTab.get(activeTab) || [];
  const selected = [...coloursByTab.values()]
    .flat()
    .find((colour) => colour.value === value);

  const chooseFromGallery = (group, colourValue) => {
    onSelect(colourValue);
    setTab(group);
    setGalleryOpen(false);
  };

  return (
    <div className="pnt-colour-picker">
      <p className="question-hint" style={{ marginBottom: 16 }}>
        Choose a colour that suits your space.
      </p>

      {tabs.length > 0 ? (
        <>
          <div
            className="pnt-tabs"
            aria-label="Colour groups"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: 5,
              marginBottom: 18,
              borderRadius: 12,
              background: '#f4f4f4',
            }}
          >
            {tabs.map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={activeTab === group}
                className={`pnt-tab ${
                  activeTab === group ? 'active' : ''
                }`}
                onClick={() => setTab(group)}
                style={{
                  flex: '1 1 80px',
                  padding: '10px 8px',
                  border: 0,
                  borderRadius: 8,
                  background:
                    activeTab === group ? '#ffffff' : 'transparent',
                  color: activeTab === group ? '#8a650b' : '#666666',
                  fontWeight: activeTab === group ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="pnt-swatch-grid" style={gridStyle}>
            {swatches.map((colour) => (
              <ColourCard
                key={colour.value}
                colour={colour}
                selected={value === colour.value}
                name={`${pickerId}-colour`}
                onSelect={onSelect}
              />
            ))}
          </div>

          {selected && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 18,
                padding: 14,
                border: '1px solid #eee3c4',
                borderRadius: 12,
                background: '#fffaf0',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  borderRadius: 10,
                  backgroundColor: previewColour(selected),
                  boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
                }}
              />

              <span>
                <span
                  style={{
                    display: 'block',
                    marginBottom: 4,
                    color: '#737373',
                    fontSize: 12,
                  }}
                >
                  Selected colour
                </span>
                <strong>{selected.label}</strong>
              </span>
            </div>
          )}

          <button
            type="button"
            className="pnt-gallery-link"
            aria-expanded={galleryOpen}
            aria-controls={`${pickerId}-gallery`}
            onClick={() => setGalleryOpen((open) => !open)}
            style={{ marginTop: 18 }}
          >
            <Icon name="palette" size={17} />
            {galleryOpen ? 'Hide Colour Gallery' : 'View Colour Gallery'}
            <Icon
              name={galleryOpen ? 'close' : 'chevron-right'}
              size={15}
            />
          </button>

          {galleryOpen && (
            <div
              id={`${pickerId}-gallery`}
              style={{
                display: 'grid',
                gap: 20,
                marginTop: 16,
                padding: 14,
                border: '1px solid #e7e7e7',
                borderRadius: 12,
                background: '#ffffff',
              }}
            >
              {tabs.map((group) => (
                <section key={group}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>
                    {group}
                  </h3>

                  <div className="pnt-swatch-grid" style={gridStyle}>
                    {(coloursByTab.get(group) || []).map((colour) => (
                      <ColourCard
                        key={colour.value}
                        colour={colour}
                        selected={value === colour.value}
                        name={`${pickerId}-gallery-colour`}
                        onSelect={(colourValue) =>
                          chooseFromGallery(group, colourValue)
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="question-hint">
          Our team will help you choose colours during your home visit.
        </p>
      )}

      <p
        className="pnt-colour-disclaimer"
        style={{ marginTop: 16, lineHeight: 1.6 }}
      >
        Screen colours are approximate. Our team will show you real shade
        cards during your home visit.
      </p>
    </div>
  );
}