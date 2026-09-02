'use client';

import Link from 'next/link';
import PageHero from '../../../components/ui/PageHero';
import SectionHeading from '../../../components/ui/SectionHeading';
import Reveal from '../../../components/ui/Reveal';
import CtaBand from '../../../components/ui/CtaBand';
import Icon from '../../../components/ui/Icon';
import { materialGroups } from '../../../data/materials';
import { contact } from '../../../data/siteConfig';
import { telHref } from '../../../lib/contact';

const promises = [
  {
    icon: 'shield',
    title: 'Branded, Not Local Substitutes',
    text: 'The brand and grade of every major material is written into your quotation, so nothing gets quietly swapped on site.',
  },
  {
    icon: 'package',
    title: 'We Buy It, You Don’t',
    text: 'Ordering, transport, unloading and storage are our job. You are not chasing suppliers or paying for deliveries.',
  },
  {
    icon: 'rupee',
    title: 'Trade Rates Passed On',
    text: 'We buy in project quantities, so material costs less through us than it would over the counter.',
  },
  {
    icon: 'check-circle',
    title: 'Checked Before It Is Used',
    text: 'Deliveries are inspected for damage, shade variation and correct grade before anything goes into your building.',
  },
];

export default function Materials() {
  return (
    <>
      <PageHero
        eyebrow="OUR STRENGTH"
        title="MATERIALS WE BUILD WITH"
        text="We supply the material as well as the labour. These are the brands we buy and install on site every day — quality you can check for yourself, at rates we pass on to you."
        image="/assets/services/finishing.svg"
        breadcrumbs={[{ label: 'Materials' }]}
      >
        <div className="btn-row" style={{ marginTop: 26 }}>
          <Link href="/quote" className="btn btn-primary">
            GET A MATERIAL QUOTE
            <Icon name="arrow-right" size={17} />
          </Link>
          <a href={telHref} className="btn btn-outline">
            <Icon name="phone" size={17} />
            {contact.phoneDisplay}
          </a>
        </div>
      </PageHero>

      {/* the brand lists */}
      <section className="section">
        <div className="container">
          <SectionHeading
            center
            eyebrow="BRANDS WE USE"
            title="QUALITY, CATEGORY BY CATEGORY"
            text="Every major material on your project comes from a known name, written into the quotation before work starts."
          />

          <div className="material-groups">
            {materialGroups.map((group, i) => (
              <Reveal key={group.id} className="material-group" delay={(i % 3) * 70}>
                <div className="material-group-head">
                  <span className="material-icon">
                    <Icon name={group.icon} size={22} strokeWidth={1.5} />
                  </span>
                  <h3>{group.title}</h3>
                </div>

                <div className="brand-grid">
                  {group.brands.map((brand) => (
                    <div className="brand-card" key={brand.name}>
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} loading="lazy" />
                      ) : (
                        <span>{brand.name}</span>
                      )}
                    </div>
                  ))}
                </div>

                {group.note && <p className="material-note">{group.note}</p>}
              </Reveal>
            ))}
          </div>

          <p className="trademark-note">
            All brand names and trademarks are the property of their respective owners. They are
            listed here to show the materials we commonly buy and install, and do not imply any
            formal partnership or endorsement.
          </p>
        </div>
      </section>

      {/* why it matters */}
      <section className="section section-dark">
        <div className="container">
          <SectionHeading
            center
            eyebrow="LABOUR + MATERIAL"
            title="WHY THIS MATTERS TO YOU"
            text="Most contractors quote labour only, and the material becomes your problem. We do both."
          />
          <div className="value-grid">
            {promises.map((item, i) => (
              <Reveal key={item.title} className="value-card" delay={(i % 4) * 70}>
                <div className="value-icon">
                  <Icon name={item.icon} size={26} strokeWidth={1.4} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="WANT A QUOTE WITH MATERIAL INCLUDED?"
        text="Tell us the scope and we will send an itemised quotation showing labour and material separately, so you can see exactly where your money goes."
      />
    </>
  );
}
