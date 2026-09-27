import Icon from '../ui/Icon';

/** Numbered progress dots — every real step gets its own number (see
    paintingContent.js's file-level note: the reference's own indicator
    compresses several screens into one dot; this one doesn't). */
export default function StepIndicator({ steps, activeIndex }) {
  // The dots alone don't say how far there is to go; this line does, in words.
  const caption =
    activeIndex >= 0 && activeIndex < steps.length
      ? `Step ${activeIndex + 1} of ${steps.length}`
      : activeIndex >= steps.length
        ? 'Last step: your details'
        : null;

  return (
    <>
    {caption && (
      <p className="pnt-step-caption" aria-live="polite">
        {caption}
      </p>
    )}
    <ol className="pnt-steps" aria-label="Progress">
      {steps.map((step, i) => (
        <li
          key={step.id}
          className={`pnt-step ${i === activeIndex ? 'current' : ''} ${i < activeIndex ? 'done' : ''}`}
          aria-current={i === activeIndex ? 'step' : undefined}
        >
          <span className="pnt-step-num">
            {i < activeIndex ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
          </span>
          {i < steps.length - 1 && <span className="pnt-step-line" aria-hidden="true" />}
        </li>
      ))}
    </ol>
    </>
  );
}
