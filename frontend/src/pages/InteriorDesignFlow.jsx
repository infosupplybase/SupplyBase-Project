import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import PaintingHero from '../components/painting/PaintingHero';
import CustomerDetailsFields from '../components/booking/CustomerDetailsFields';
import SlotPicker from '../components/booking/SlotPicker';
import useInteriorDesignCatalogue from '../hooks/useInteriorDesignCatalogue';
import {
  getCategoryBySlug, getProjectBySlug, idPackageTiers, idInclusions, idStyles, idColourThemes,
  ID_REFERENCE_PACKAGES, ID_REFERENCE_STATS, ID_REFERENCE_PROJECT_SLUG,
  idWhatsNext, idProcessSteps, idFaqs,
} from '../data/interiorDesignContent';
import { emptyDetails, validateDetails } from '../lib/bookingDetails';
import { useAuth } from '../context/AuthContext';
import api, { friendlyError } from '../lib/api';
import { contact } from '../data/siteConfig';

/**
 * /services/interior-design/:categorySlug/:projectSlug — one page, every
 * project. Follows the reference's own screen order: Package -> Details
 * -> Customise -> Consultation Details -> Schedule -> Confirm, with What
 * Happens Next / Process / Support bundled into the confirmation stage
 * rather than fragmented into more routes (same precedent as Painting's
 * Renovation closing banner).
 *
 * Only `ID_REFERENCE_PROJECT_SLUG` ("Modern Minimal") has real package
 * prices/area/timeline/warranty — every other project shows an honest
 * "Quotation after site visit" instead of a guessed number (see V18's
 * migration comment).
 */
const PACKAGE = 0;
const DETAILS = 1;
const CUSTOMISE = 2;
const CONSULT_DETAILS = 3;
const SCHEDULE = 4;
const CONFIRM = 5;

export default function InteriorDesignFlow({
  modal = false,
  categorySlug: propCategorySlug,
  projectSlug: propProjectSlug,
  onBackToCatalogue,
  onStepChange,
}) {
  const params = useParams();

  const categorySlug = propCategorySlug || params.categorySlug;
  const projectSlug = propProjectSlug || params.projectSlug;
  const category = getCategoryBySlug(categorySlug);
  const project = category ? getProjectBySlug(category.slug, projectSlug) : null;
  const { user } = useAuth();
  const { category: liveCategory } = useInteriorDesignCatalogue();

  const [stage, setStage] = useState(PACKAGE);
  const [tier, setTier] = useState('standard');
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  const [customiseTab, setCustomiseTab] = useState('style');
  const [style, setStyle] = useState('');
  const [colour, setColour] = useState('');
  const [requirements, setRequirements] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const [details, setDetails] = useState(user
    ? { ...emptyDetails, name: user.fullName || '', phone: user.phone || '', email: user.email || '' }
    : emptyDetails);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const hasPricing = project?.hasReferencePricing;
  const packagePrice = useMemo(() => {
    if (!hasPricing) return null;
    return ID_REFERENCE_PACKAGES[tier];
  }, [hasPricing, tier]);

  if (!category || !project) {
    if (modal) return null;

    return (
      <Navigate
        to="/services/interior-design"
        replace
      />
    );
  }

  const jumpToStage = (s) => {
    setStage(s);

    if (modal) {
      onStepChange?.();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setSubmitError('');

    if (stage === PACKAGE && modal) {
      onBackToCatalogue?.();
      return;
    }

    setStage((s) => Math.max(s - 1, PACKAGE));

    if (modal) {
      onStepChange?.();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canLeaveDetails = () => {
    const next = validateDetails(details);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setDetail = (key) => (e) => {
    setDetails((d) => ({ ...d, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!date || !time) {
      setErrors({ slot: 'Please choose a date and a time' });
      return;
    }

    setBusy(true);
    setSubmitError('');
    try {
      const tierMeta = idPackageTiers.find((t) => t.key === tier);
      const parts = [
        `Project: ${category.name} — ${project.name} (${project.location})`,
        `Package: ${tierMeta?.name || tier}${packagePrice ? ` (${packagePrice.priceDisplay})` : ' (quotation after site visit)'}`,
      ];
      if (style) parts.push(`Style: ${idStyles.find((s) => s.key === style)?.name || style}`);
      if (colour) parts.push(`Colour theme: ${idColourThemes.find((c) => c.key === colour)?.name || colour}`);
      if (requirements.trim()) parts.push(requirements.trim());

      const result = await api.createBooking({
        serviceSlug: 'interior-design',
        answers: [{ key: 'notes', value: parts.join(' · ').slice(0, 500), label: 'Selected project, package and requirements' }],
        preferredDate: date,
        preferredTime: time,
        name: details.name,
        phone: details.phone,
        whatsapp: details.whatsapp || null,
        email: details.email || null,
        address: details.address,
        city: details.city,
        pincode: details.pincode || null,
      });
      setReceipt(result);
      setStage(CONFIRM);

      if (modal) {
        onStepChange?.();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      if (err && err.fieldErrors) setErrors(err.fieldErrors);
      setSubmitError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- confirmed */
  if (stage === CONFIRM && receipt) {
    const waMessage = encodeURIComponent(`Hello Supplybase, this is about my booking ${receipt.bookingNumber}.`);
    // The reference says both "Booking Confirmed" and "our team will call to
    // confirm" — resolved using the real backend status rather than always
    // claiming a confirmed appointment (see the brief's explicit note on
    // this). Every booking starts PAYMENT_PENDING/BOOKING_REQUESTED, so
    // this reads "Consultation Request Received" unless the booking has
    // genuinely already reached CONFIRMED.
    const isConfirmed = receipt.status === 'CONFIRMED';
    return (
      <div
  className={
    modal
      ? 'wizard-shell !min-h-0 !bg-transparent !p-0'
      : 'wizard-shell'
  }
>
  <div
    className={
      modal
        ? 'wizard-container !w-full !max-w-none !bg-transparent !p-0'
        : 'wizard-container'
    }
  >
          <div className="wizard-card">
            <div className="confirmed">
              <div className="confirmed-tick">
                <Icon name="check" size={38} strokeWidth={3} />
              </div>
              <h2>{isConfirmed ? 'Booking Confirmed!' : 'Consultation Request Received'}</h2>
              <p>{isConfirmed ? 'Our expert will visit your home at the confirmed time.' : 'Our expert will call you shortly to confirm your home visit.'}</p>

              <dl className="confirmed-panel">
                <div><dt>Booking ID</dt><dd className="booking-id">{receipt.bookingNumber}</dd></div>
                <div><dt>Date &amp; Time</dt><dd>{receipt.date}, {receipt.time}</dd></div>
                <div><dt>Project</dt><dd>{project.name} — {tier}</dd></div>
                <div><dt>Location</dt><dd>{details.city}</dd></div>
              </dl>

              <div className="pnt-fee-note">
                <Icon name="info" size={17} />
                <span>{receipt.message}</span>
              </div>

              <Link to="/dashboard" className={
  modal
    ? 'btn btn-primary md:!w-[45%] !mx-auto'
    : 'btn btn-primary'
}>GO TO DASHBOARD</Link>
              <div
  className={
    modal
      ? 'btn-row !flex !items-center !justify-center !gap-3'
      : 'btn-row'
  }
  style={{ marginTop: 12 }}
>
                <a href={`https://wa.me/${contact.phoneRaw}?text=${waMessage}`} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <Icon name="whatsapp" size={17} /> CHAT ON WHATSAPP
                </a>
                {modal ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-back"
                    onClick={onBackToCatalogue}
                  >
                    BACK TO INTERIOR DESIGN
                  </button>
                ) : (
                  <Link
                    to="/services/interior-design"
                    className="btn btn-ghost btn-back"
                  >
                    BACK TO INTERIOR DESIGN
                  </Link>
                )}
              </div>
            </div>
          </div>

          {!modal && (
            <>
              {/* What Happens Next */}
              <div className="pnt-included" style={{ marginTop: 24 }}>
                <h3>What Happens Next?</h3>

                <ul>
                  {idWhatsNext.map((step, i) => (
                    <li
                      key={step.title}
                      className="id-next-li"
                    >
                      <span className="id-next-num">
                        {i + 1}
                      </span>

                      <span>
                        <strong style={{ display: 'block' }}>
                          {step.title}
                        </strong>

                        {step.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Process */}
              <div className="id-process-row">
                {idProcessSteps.map((p) => (
                  <div
                    key={p.label}
                    className="id-process-step"
                  >
                    <Icon
                      name={p.icon}
                      size={24}
                    />

                    <span>{p.label}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/services/interior-design"
                className="btn btn-primary btn-block"
                style={{ marginBottom: 24 }}
              >
                VIEW MORE PROJECTS

                <Icon
                  name="arrow-right"
                  size={17}
                />
              </Link>

              {/* Support */}
              <div className="id-support-card">
                <h3>Need Help?</h3>

                <a
                  href={`tel:+${contact.phoneRaw}`}
                  className="id-support-row"
                >
                  <Icon
                    name="phone"
                    size={18}
                  />
                  Call Us — {contact.phoneDisplay}
                </a>

                <a
                  href={`https://wa.me/${contact.phoneRaw}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="id-support-row"
                >
                  <Icon
                    name="whatsapp"
                    size={18}
                  />
                  Chat on WhatsApp
                </a>

                <a
                  href={`mailto:${contact.email}`}
                  className="id-support-row"
                >
                  <Icon
                    name="mail"
                    size={18}
                  />
                  Email Us — {contact.email}
                </a>

                <div className="id-faqs">
                  {idFaqs.map((f) => (
                    <details key={f.q}>
                      <summary>{f.q}</summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ details */
  if (stage === CONSULT_DETAILS) {
    return (
      <div className={modal ? 'wizard-shell id-modal-flow' : 'wizard-shell'}>
        <div className="wizard-container">
          <FlowTopBar project={project} onBack={goBack} />
          <form onSubmit={(e) => { e.preventDefault(); if (canLeaveDetails()) jumpToStage(SCHEDULE); }} noValidate>
            <div className="wizard-card">
              <div className="wizard-card-head">
                <h2>Your Details</h2>
                <p>We will contact you to confirm the appointment.</p>
              </div>
              <CustomerDetailsFields details={details} setDetail={setDetail} errors={errors} idPrefix="id" />
              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <div
  className={
    modal
      ? 'wizard-foot !static !inset-auto !z-auto !mt-4 !grid !w-full !grid-cols-[72px_minmax(0,1fr)] !items-center !gap-2 !border-0 !bg-transparent !p-0 !shadow-none md:!flex md:!justify-between md:!gap-3'
      : 'wizard-foot'
  }
>
                <button
                  type="button"
                  className={
  modal
    ? 'btn btn-ghost btn-back !w-[72px] !min-w-[72px] !px-2 md:!w-auto md:!min-w-0 md:!flex-none md:!px-4'
    : 'btn btn-ghost btn-back'
}
                  onClick={goBack}
                >
                  BACK
                </button>

                <button
                  type="submit"
                  className={
  modal
    ? 'btn btn-primary !w-full !min-w-0 !max-w-full !px-3 !whitespace-nowrap md:!ml-auto md:!w-auto md:!max-w-none md:!flex-none md:!px-5'
    : 'btn btn-primary'
}
                >
                  CONTINUE
                  <Icon name="arrow-right" size={17} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- schedule */
  if (stage === SCHEDULE) {
    return (
      <div
  className={
    modal
      ? 'wizard-shell !min-h-0 !bg-transparent !p-0'
      : 'wizard-shell'
  }
>
        <div
  className={
    modal
      ? 'wizard-container !w-full !max-w-none !bg-transparent !p-0'
      : 'wizard-container'
  }
>
          <FlowTopBar project={project} onBack={goBack} />
          <form onSubmit={handleSubmit} noValidate>
            <div className="wizard-card">
              <div className="wizard-card-head">
                <h2>Book a Consultation</h2>
                <p>Our designer will visit, measure your space and share a detailed quotation.</p>
              </div>
              <SlotPicker
                serviceSlug="interior-design"
                date={date}
                time={time}
                onPick={(d, t) => { setDate(d); setTime(t); setErrors((e) => ({ ...e, slot: undefined })); }}
                error={errors.slot}
              />

              <div className="pnt-fee-strip">
                <span>{liveCategory ? liveCategory.visitFeeDisplay : '₹99.00'}</span>
                <span>Consultation fee — adjusted in your final project cost if you proceed</span>
              </div>

              {submitError && (
                <div role="alert" className="alert alert-error" style={{ marginTop: 18 }}>
                  <Icon name="info" size={18} /><span>{submitError}</span>
                </div>
              )}
              <div
  className={
    modal
      ? 'wizard-foot !static !inset-auto !z-auto !mt-4 !grid !w-full !grid-cols-[92px_minmax(0,1fr)] !items-stretch !gap-2 !border-0 !bg-transparent !p-0 !shadow-none md:!flex md:!justify-end md:!gap-3'
      : 'wizard-foot'
  }
>
                <button
  type="button"
  className={
    modal
      ? 'btn btn-ghost btn-back !m-0 !w-full !min-w-0 !max-w-full !px-2 !overflow-hidden !whitespace-nowrap md:!w-auto md:!px-4'
      : 'btn btn-ghost btn-back'
  }
  onClick={goBack}
>
  BACK
</button>
                <button
  type="submit"
  className={
  modal
    ? 'btn btn-primary !m-0 !w-full !min-w-0 !max-w-full !px-2 !text-[10px] !whitespace-nowrap !overflow-hidden md:!w-fit md:!min-w-0 md:!max-w-none md:!px-5 md:!text-sm md:!ml-auto'
    : 'btn btn-primary'
}
  disabled={busy}
>
                  {busy ? 'BOOKING…' : 'CONFIRM BOOKING'} <Icon name="arrow-right" size={17} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- PACKAGE */
  if (stage === PACKAGE) {
    return (
      <>
  {!modal && (
    <PaintingHero
      eyebrow="INTERIOR DESIGN"
      title={`${category.name.replace(' Interiors', '')} – ${project.name}`}
      tagline={project.location}
      image={project.image}
      trustPoints={[]}
    />
  )}

  <section
    className={
      modal
        ? '!w-full !bg-transparent !p-0'
        : 'pnt-section'
    }
  >
    <div
      className={
        modal
          ? '!w-full !max-w-none !mx-auto !p-0'
          : 'container container-narrow'
      }
    >
            <h2 className="pnt-step-title">Choose Your Package</h2>

            <div className="id-package-grid">
              {idPackageTiers.map((t) => {
                const price = hasPricing ? ID_REFERENCE_PACKAGES[t.key] : null;
                return (
                  <label key={t.key} className={`id-package-card ${tier === t.key ? 'selected' : ''}`}>
                    <input type="radio" name="tier" value={t.key} checked={tier === t.key} onChange={() => setTier(t.key)} />
                    <span className="id-package-icon"><Icon name={t.icon} size={24} /></span>
                    <span className="id-package-body">
                      <strong>{t.name}</strong>
                      <span className="id-package-price">{price ? price.priceDisplay : 'Quotation after site visit'}</span>
                      <span className="id-package-blurb">{t.blurb}</span>
                    </span>
                    {tier === t.key && <span className="id-package-check"><Icon name="check" size={12} strokeWidth={3.5} /></span>}
                  </label>
                );
              })}
            </div>

            <button type="button" className="pnt-compare-link" onClick={() => setCompareOpen(true)}>
              <Icon name="layers" size={16} /> Compare Packages <Icon name="chevron-right" size={15} />
            </button>

            <div className="pnt-included">
              <h3>What&rsquo;s Included</h3>
              <div className="id-inclusion-grid">
                {idInclusions.map((inc) => (
                  <div key={inc.label} className="id-inclusion-item">
                    <Icon name={inc.icon} size={20} />
                    <span>{inc.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {!hasPricing && (
              <p className="wp-rate-note">
                This project&rsquo;s package price will be confirmed during your free site consultation — the ₹4.99–9.99 Lakh
                range shown for Modern Minimal (1 BHK, Mumbai) is a specific illustrated example, not a price for every home.
              </p>
            )}

            <div
  className={
    modal
      ? 'pnt-step-actions !flex !w-full !items-center !justify-between !gap-3'
      : 'pnt-step-actions'
  }
>
              {modal ? (
  <button
    type="button"
    className="btn btn-ghost btn-back !w-auto !min-w-0 !flex-none !px-4"
    onClick={onBackToCatalogue}
  >
    BACK
  </button>
) : (
  <Link
    to={`/services/interior-design/${category.slug}`}
    className="btn btn-ghost btn-back"
  >
    BACK
  </Link>
)}
              <button
  type="button"
  className={
    modal
      ? 'btn btn-primary !ml-auto !w-auto !min-w-0 !flex-none !px-5'
      : 'btn btn-primary'
  }
  onClick={() => jumpToStage(DETAILS)}
>
                Continue <Icon name="arrow-right" size={17} />
              </button>
            </div>
          </div>
        </section>

        {compareOpen && (
          <div className="pnt-modal-overlay" onClick={() => setCompareOpen(false)}>
            <div className="pnt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pnt-modal-head">
                <h3>Compare Packages</h3>
                <button type="button" onClick={() => setCompareOpen(false)} aria-label="Close">
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="pnt-modal-body pnt-compare-table">
                {idPackageTiers.map((t) => {
                  const price = hasPricing ? ID_REFERENCE_PACKAGES[t.key] : null;
                  return (
                    <div key={t.key} className="pnt-compare-col">
                      <strong>{t.name}</strong>
                      <span className="pnt-option-price">{price ? price.priceDisplay : 'Quote after visit'}</span>
                      <p>{t.blurb} All tiers include the full inclusion list above — material grade and finish level are what scale with the tier, confirmed exactly during your consultation.</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* -------------------------------------------------------------- DETAILS */
  if (stage === DETAILS) {
    return (
      <div
        className={
          modal
            ? 'pnt-flow-shell !min-h-0 !bg-transparent !p-0'
            : 'pnt-flow-shell'
        }
      >
        <div className="container container-narrow">
          <FlowTopBar project={project} onBack={goBack} plain />
          <div className="pnt-step-card">
            <img src={project.image} alt={project.name} className="id-detail-hero" />
            <h2 className="pnt-step-title" style={{ marginTop: 16 }}>{project.name}</h2>
            <p className="question-hint"><Icon name="map-pin" size={14} /> {project.location} · {idPackageTiers.find((t) => t.key === tier)?.name} package
              {packagePrice ? ` · ${packagePrice.priceDisplay}` : ' · Quotation after site visit'}
            </p>

            <div className="pnt-tabs" role="tablist" style={{ marginTop: 16 }}>
              {['overview', 'inclusions', 'materials', 'gallery'].map((t) => (
                <button key={t} type="button" role="tab" aria-selected={detailTab === t} className={`pnt-tab ${detailTab === t ? 'active' : ''}`} onClick={() => setDetailTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {detailTab === 'overview' && (
              <div className="id-tab-panel">
                <p>
                  A {category.name} concept in {project.location}, finished to the {idPackageTiers.find((t) => t.key === tier)?.name.toLowerCase()} tier.
                  {project.slug === ID_REFERENCE_PROJECT_SLUG
                    ? ' This is the illustrated reference project — its area, timeline and warranty below are real example figures.'
                    : ' Exact scope, materials and timeline for this project are confirmed during your free site consultation.'}
                </p>
                {hasPricing && (
                  <div className="id-stats-row">
                    <div><Icon name="ruler" size={18} /><span>{ID_REFERENCE_STATS.areaSqft}</span></div>
                    <div><Icon name="clock" size={18} /><span>{ID_REFERENCE_STATS.timeline}</span></div>
                    <div><Icon name="shield" size={18} /><span>{ID_REFERENCE_STATS.warranty} warranty</span></div>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'inclusions' && (
              <div className="id-tab-panel id-inclusion-grid">
                {idInclusions.map((inc) => (
                  <div key={inc.label} className="id-inclusion-item">
                    <Icon name={inc.icon} size={20} />
                    <span>{inc.label}</span>
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'materials' && (
              <div className="id-tab-panel">
                <p className="question-hint">
                  Material specification is confirmed with you during the site consultation, based on the package tier and
                  your customisation choices — we don&rsquo;t fabricate a fixed materials list before that visit.
                </p>
              </div>
            )}

            {detailTab === 'gallery' && (
              <div className="id-tab-panel">
                <button type="button" className="id-gallery-thumb" onClick={() => setPreviewOpen(true)}>
                  <img src={project.image} alt={project.name} />
                </button>
                <p className="question-hint" style={{ marginTop: 8 }}>+ more photos shared during your consultation.</p>
              </div>
            )}

            <div className="pnt-step-actions">
              <button type="button" className="btn btn-ghost btn-back" onClick={goBack}>BACK</button>
              <button type="button" className="btn btn-primary" onClick={() => jumpToStage(CUSTOMISE)}>
                Continue <Icon name="arrow-right" size={17} />
              </button>
            </div>
            <Link to="/quote?service=interior-design" className="pnt-compare-link" style={{ marginTop: 12 }}>
              <Icon name="chat" size={16} /> Get Detailed Quotation <Icon name="chevron-right" size={15} />
            </Link>
          </div>
        </div>

        {previewOpen && (
          <div className="pnt-modal-overlay" onClick={() => setPreviewOpen(false)}>
            <div className="pnt-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pnt-modal-head">
                <h3>{project.name}</h3>
                <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close"><Icon name="close" size={18} /></button>
              </div>
              <div className="pnt-modal-body">
                <img src={project.image} alt={project.name} style={{ width: '100%', borderRadius: 8 }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------ CUSTOMISE */
  const custTabs = ['style', 'materials', 'colours', 'layouts'];
  return (
    <div
      className={
        modal
          ? 'pnt-flow-shell !min-h-0 !bg-transparent !p-0'
          : 'pnt-flow-shell'
      }
    >
      <div className="container container-narrow">
        <FlowTopBar project={project} onBack={goBack} plain />
        <div
          className={
            modal
              ? 'pnt-step-card !w-full !max-w-none !mx-auto !pb-4 md:!p-[18px]'
              : 'pnt-step-card'
          }
        >
          <h2 className="pnt-step-title">Customise Your Design</h2>

          <div className="pnt-tabs" role="tablist">
            {custTabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={customiseTab === t} className={`pnt-tab ${customiseTab === t ? 'active' : ''}`} onClick={() => setCustomiseTab(t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {customiseTab === 'style' && (
            <div className="id-tab-panel">
              <div
                className={
                  modal
                    ? 'pnt-option-list !w-full md:!max-w-[520px] md:!mx-auto'
                    : 'pnt-option-list'
                }
              >
                {idStyles.map((s) => (
                  <label
                    key={s.key}
                    className={`pnt-option ${style === s.key ? 'selected' : ''
                      } ${modal
                        ? '!w-full md:!min-h-[48px] md:!px-3 md:!py-2'
                        : ''
                      }`}
                  >
                    <input type="radio" name="style" checked={style === s.key} onChange={() => setStyle(s.key)} />
                    <span className="pnt-option-icon"><Icon name={s.icon} size={24} /></span>
                    <span className="pnt-option-body">
                      <span className="pnt-option-label">{s.name}</span>
                      <span className="pnt-option-hint">{s.hint}</span>
                    </span>
                    <span className="pnt-option-radio" aria-hidden="true" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {customiseTab === 'materials' && (
            <div className="id-tab-panel">
              <p className="question-hint">
                Material choices depend on your selected package and space — our designer will show you real samples and
                confirm your final selection during the consultation.
              </p>
            </div>
          )}

          {customiseTab === 'colours' && (
            <div className="id-tab-panel">
              <div className="pnt-swatch-grid">
                {idColourThemes.map((c) => (
                  <label key={c.key} className={`pnt-swatch ${colour === c.key ? 'selected' : ''}`}>
                    <input type="radio" name="colour" checked={colour === c.key} onChange={() => setColour(c.key)} />
                    <span className="pnt-swatch-chip" style={{ background: c.hex }} aria-hidden="true">
                      {colour === c.key && <Icon name="check" size={16} strokeWidth={3} />}
                    </span>
                    <span className="pnt-swatch-name">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {customiseTab === 'layouts' && (
            <div className="id-tab-panel">
              <p className="question-hint">
                Floor plans and layout options depend on your actual room measurements — these are confirmed on site, not
                guessed in advance.
              </p>
            </div>
          )}

          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="id-requirements">Add Special Requirements (Optional)</label>
            <textarea
              id="id-requirements"
              rows={3}
              placeholder="e.g. more storage, study table, TV unit, etc."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <div
            className={
              modal
                ? 'id-3d-actions !flex !w-full !flex-col !gap-2 md:!flex-row'
                : 'id-3d-actions'
            }
          >
            <button type="button" className={
              modal
                ? 'btn btn-ghost !w-full !whitespace-normal !text-center md:!w-auto'
                : 'btn btn-ghost'
            } onClick={() => setPreviewOpen(true)}>
              <Icon name="eye" size={16} /> View Design Preview
            </button>
            <a
              href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(`Hello Supplybase, I'd like a 3D design consultation for ${project.name} (${category.name}).`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={
                modal
                  ? 'btn btn-ghost !w-full !whitespace-normal !text-center md:!w-auto'
                  : 'btn btn-ghost'
              }
            >
              <Icon name="chat" size={16} /> Request a 3D Design Consultation
            </a>
          </div>

          <div
  className={
    modal
      ? 'pnt-step-actions !grid !w-full !grid-cols-[72px_minmax(0,1fr)] !items-center !gap-2 md:!flex md:!justify-between md:!gap-3'
      : 'pnt-step-actions'
  }
>
            <button
              type="button"
              className={
  modal
    ? 'btn btn-ghost btn-back !w-[72px] !min-w-[72px] !px-2 md:!w-auto md:!min-w-0 md:!flex-none md:!px-4'
    : 'btn btn-ghost btn-back'
}
              onClick={goBack}
            >
              BACK
            </button>
            <button
              type="button"
              className={
  modal
    ? 'btn btn-primary !w-full !min-w-0 !max-w-full !px-2 !text-[12px] !whitespace-nowrap !overflow-hidden md:!ml-auto md:!w-auto md:!max-w-none md:!flex-none md:!px-5 md:!text-sm'
    : 'btn btn-primary'
}
              onClick={() => jumpToStage(CONSULT_DETAILS)}
            >
              Book Now ₹99 <Icon name="arrow-right" size={17} />
            </button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="pnt-modal-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="pnt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pnt-modal-head">
              <h3>{project.name} — Design Preview</h3>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close"><Icon name="close" size={18} /></button>
            </div>
            <div className="pnt-modal-body">
              <img src={project.image} alt={project.name} style={{ width: '100%', borderRadius: 8 }} />
              <p className="question-hint" style={{ marginTop: 10 }}>
                An illustrative concept preview, not a personalised 3D render of your own space — request a 3D design
                consultation below for that.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowTopBar({ project, onBack, plain }) {
  return (
    <div className={plain ? 'pnt-top' : 'wizard-top'}>
      <button type="button" className={plain ? 'pnt-back' : 'wizard-back'} onClick={onBack} aria-label="Go back">
        <Icon name="arrow-left" size={20} />
      </button>
      <h1 className={plain ? 'pnt-top-title' : 'wizard-title'}>{project.name}</h1>
      <a
        href={`https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(`Hello Supplybase, I need help with ${project.name}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={plain ? 'pnt-help' : 'wizard-help'}
      >
        Need help?
      </a>
    </div>
  );
}
