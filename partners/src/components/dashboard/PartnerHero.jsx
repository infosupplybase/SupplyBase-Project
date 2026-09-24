import { useState } from 'react';
import { PARTNER_PHONE_RAW } from '../../config';

/**
 * The "join Supplybase" banner shown to anyone who is not yet a working
 * partner (no application, pending, rejected, suspended). An approved partner
 * goes straight to their jobs and earnings instead.
 *
 * The WhatsApp button opens a chat with the partner desk, whose number is set
 * in config.js (PARTNER_PHONE_RAW, with the country code — wa.me needs it).
 */
export default function PartnerHero() {
  const [phone, setPhone] = useState('');

  const handleJoin = () => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    const message = encodeURIComponent(
      `Hello Supplybase, I want to join as a service professional. My WhatsApp number is +91 ${cleanPhone}.`
    );

    window.open(
      `https://wa.me/${PARTNER_PHONE_RAW}?text=${message}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <section className="partner-hero-section">

      {/* =====================================================
          MAIN HERO
          ===================================================== */}

      <div className="partner-hero-main">

        <div className="container partner-hero-container">

          {/* LEFT CONTENT */}

          <div className="partner-hero-content">

            <span className="partner-hero-small">
              SUPPLYBASE PARTNERS
            </span>

            <h1>
              Earn More.
              <br />
              Earn Respect.
              <br />
              <span>Build Your Future.</span>
            </h1>

            <p>
              Join Supplybase as a service professional and get access to
              genuine projects, reliable work opportunities and a growing
              customer network.
            </p>

            <div className="partner-hero-points">

              <div>
                <span>✓</span>
                More project opportunities
              </div>

              <div>
                <span>✓</span>
                Transparent work process
              </div>

              <div>
                <span>✓</span>
                Professional support
              </div>

            </div>

          </div>


          {/* RIGHT TRANSPARENT IMAGE */}

          <div className="partner-hero-image-wrap">

            {/* Old circle intentionally removed */}

            <img
              src="/assets/partners/partner-hero.png"
              alt="Supplybase service professionals"
              className="partner-hero-image"
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          WHATSAPP JOIN BOX
          ===================================================== */}

      <div className="container partner-whatsapp-container">

        <div className="partner-whatsapp-box">

          <div className="partner-whatsapp-content">

            <h2>
              Join Supplybase as a Service Professional
            </h2>

            <p>
              Share your WhatsApp number and we'll reach out to you.
            </p>

          </div>


          <div className="partner-whatsapp-form">

            <div className="partner-phone-input">

              <div className="partner-country-code">

                <span>🇮🇳</span>

                <span>+91</span>

                <span className="partner-arrow">

                </span>

              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 10)
                  )
                }
                placeholder="Enter WhatsApp number"
                maxLength={10}
              />

            </div>


            <button
              type="button"
              className="partner-join-button"
              onClick={handleJoin}
            >
              Join Us
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}
