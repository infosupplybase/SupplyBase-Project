import { createPortal } from 'react-dom';
import HomeServiceAvailability from './HomeServiceAvailability';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { homeTransformations } from '../../data/homeTransformations';
import '../../styles/home-extras.css';

const benefits = [
  { icon: 'helmet', title: 'Skilled professionals', text: 'Find help for painting, repairs and home improvement.' },
  { icon: 'rupee', title: 'Clear estimates', text: 'Understand the proposed scope and price before work begins.' },
  { icon: 'calendar', title: 'Convenient booking', text: 'Choose your service and an available visit time.' },
  { icon: 'chat', title: 'Customer support', text: 'Get help choosing a service and planning your visit.' },
];

const faqs = [
  {
    question: 'How do I book a service?',
    answer: 'Choose a service, complete its booking steps, select an available visit time and enter your contact details. Review your details before confirming.',
  },
  {
    question: 'When is the final price confirmed?',
    answer: 'Starting prices and estimates depend on your selections. For work that needs an inspection, our team confirms the scope and final price during the site visit.',
  },
  {
    question: 'Is there a visit or consultation fee?',
    answer: 'Any applicable visit or consultation fee is shown in the booking flow. Review it before you confirm your booking.',
  },
  {
    question: 'Can I choose materials and finishes?',
    answer: 'Share your preferred materials, colours and finishes with our team. They can discuss suitable options and include the agreed choices in the estimate.',
  },
  {
    question: 'How can I request a different visit time?',
    answer: 'Contact our team with your booking number and preferred time. They will help you check availability and the options for your booking.',
  },
];

function Heading({ eyebrow, title, text }) {
  return (
    <div className="sbx-heading">
      <span className="sbx-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function HomeWhyChoose() {
  return (
    <section className="sbx-section sbx-why-choose" aria-label="Why choose SupplyBase">
      <div className="container">
        <div className="popular-services-head">
          <h2 className="popular-services-title">Why choose SupplyBase?</h2>
        </div>
        <div className="sbx-benefits">
          {benefits.map((item) => (
            <article className="sbx-benefit" key={item.title}>
              <span className="sbx-icon"><Icon name={item.icon} size={25} /></span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison({ project }) {
  const id = useId();
  const [position, setPosition] = useState(50);
  return (
    <article className="sbx-project">
      <div className="sbx-comparison">
        <img src={project.after} alt={`${project.title}, after the work`} loading="lazy" decoding="async" />
        <div className="sbx-before" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <img src={project.before} alt={`${project.title}, before the work`} loading="lazy" decoding="async" />
        </div>
        <span className="sbx-label sbx-label--before">Before</span>
        <span className="sbx-label sbx-label--after">After</span>
        <span className="sbx-divider" style={{ left: `${position}%` }} aria-hidden="true">
          <span><Icon name="arrow-left" size={15} /><Icon name="arrow-right" size={15} /></span>
        </span>
      </div>
      <div className="sbx-project-body">
        <h3>{project.title}</h3>
        {project.description && <p>{project.description}</p>}
        <label htmlFor={id}>Slide to compare before and after</label>
        <input id={id} type="range" min="0" max="100" value={position} onChange={(e) => setPosition(Number(e.target.value))} aria-valuetext={`${position}% before image visible`} />
      </div>
    </article>
  );
}

export function HomeBeforeAfter() {
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (!selectedService) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previousFocus = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedService(null);
      }

      if (event.key === 'Tab') {
        const dialog = document.querySelector('.sbx-preview-dialog');
        const buttons = dialog?.querySelectorAll('button');
        if (!buttons?.length) return;
        event.preventDefault();
        buttons[0].focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [selectedService]);

  const services = [
    { key: 'interior-design', label: 'Interior Design', icon: 'sofa' },
    { key: 'interior-by-choice', label: 'Interior by Choice', icon: 'building' },
    { key: 'painting', label: 'Painting', icon: 'roller' },
    { key: 'waterproofing', label: 'Waterproofing', icon: 'droplet' },
    { key: 'pop-ceiling-design', label: 'POP Ceiling & Design', icon: 'ceiling' },
    { key: 'plumbing', label: 'Plumber', icon: 'tap' },
    { key: 'electrical', label: 'Electrician', icon: 'bolt' },
    { key: 'ac-services', label: 'AC Services', icon: 'plug' },
  ];

  const selected = services.find(
    (service) => service.key === selectedService
  );

  // Hidden until real before/after photos are added to data/homeTransformations.js;
  // without them every service opens an empty pop-up.
  if (!homeTransformations.length) return null;

  return (
    <section
      className="sbx-section sbx-section--soft"
      aria-label="Before and after our work"
    >
      <div className="sbx-wrap">
        <Heading
          eyebrow="BEFORE & AFTER"
          title="See the difference"
          text="A closer look at home improvements, from preparation to finish."
        />

        <div
          className="sbx-transformation-services"
          role="group"
          aria-label="Choose a service"
        >
          {services.map((service) => (
            <button
              key={service.key}
              type="button"
              className={`sbx-transformation-service ${
                selectedService === service.key ? 'is-active' : ''
              }`}
              aria-pressed={selectedService === service.key}
              onClick={() => setSelectedService(service.key)}
            >
              <span className="sbx-transformation-service-icon">
                <Icon name={service.icon} size={34} />
              </span>
              <span className="sbx-transformation-service-label">
                {service.label}
              </span>
            </button>
          ))}
        </div>

        {selected && createPortal(
          <div
            className="sbx-preview-overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedService(null);
              }
            }}
          >
            <section
              className="sbx-preview-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sbx-preview-title"
              tabIndex={-1}
              ref={(element) => element?.focus()}
            >
              <header className="sbx-preview-header">
                <div>
                  <span className="sbx-eyebrow">OUR WORK</span>
                  <h2 id="sbx-preview-title">
                    Before &amp; After — {selected.label}
                  </h2>
                </div>

                <button
                  type="button"
                  className="sbx-preview-close"
                  aria-label="Close before and after"
                  onClick={() => setSelectedService(null)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </header>

              <div className="sbx-preview-content" />
            </section>
          </div>,
          document.body
        )}
      </div>
    </section>
  );
}
export function HomeAvailability() {
  return <HomeServiceAvailability />;
}
export function HomeFaq() {
  return (
    <section className="sbx-section" aria-label="Frequently asked questions">
      <div className="sbx-wrap sbx-faq-layout">
        <div>
          <Heading eyebrow="HELP BEFORE YOU BOOK" title="Questions before you book?" text="A few useful answers to help you plan your next home service." />
          <Link className="sbx-text-link" to="/contact">Have another question? <Icon name="arrow-right" size={17} /></Link>
        </div>
        <div className="sbx-faq-list">
          {faqs.map((item) => (
            <details className="sbx-faq" key={item.question}>
              <summary><span>{item.question}</span><Icon name="chevron-down" size={19} /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
