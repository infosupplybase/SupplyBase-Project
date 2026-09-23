import Reveal from './Reveal';

/**
 * SectionHeading — eyebrow + title + optional supporting text.
 * `title` may contain a <span className="gold"> for the highlighted word.
 */
export default function SectionHeading({ eyebrow, title, text, center = false, className = '' }) {
  return (
    <Reveal className={`section-head ${center ? 'center' : ''} ${className}`.trim()}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <div className="rule" />
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </Reveal>
  );
}
