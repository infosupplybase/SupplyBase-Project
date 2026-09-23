
// import { useAuth } from '../context/AuthContext';
// import '../styles/partnerDashboard.css';

// export default function Dashboard() {
//   const { user } = useAuth();

//   const firstName =
//     (user?.fullName || '').split(' ')[0] || 'Partner';

//   return (
//     <div className="dashboard-page">

//       <section className="dashboard-hero">

//         <div className="dashboard-hero-inner">

//           {/* LEFT SIDE */}
//           <div className="dashboard-hero-copy">

//             <span className="dashboard-hero-eyebrow">
//               SUPPLYBASE PARTNERS
//             </span>

//             <h1 className="dashboard-hero-title">
//               EARN MORE.
//               <br />

//               EARN RESPECT.
//               <br />

//               <span className="dashboard-hero-highlight">
//                 BUILD YOUR FUTURE.
//               </span>
//             </h1>

//             <p className="dashboard-hero-sub">
//               Join Supplybase as a service professional and get access to
//               genuine projects, reliable work opportunities and a growing
//               customer network.
//             </p>

//             <ul className="dashboard-hero-checks">

//               <li>
//                 <span className="dashboard-check">✓</span>
//                 <span>More project opportunities</span>
//               </li>

//               <li>
//                 <span className="dashboard-check">✓</span>
//                 <span>Transparent work process</span>
//               </li>

//               <li>
//                 <span className="dashboard-check">✓</span>
//                 <span>Professional support</span>
//               </li>

//             </ul>

//           </div>


//           {/* RIGHT SIDE IMAGE */}
//           <div className="dashboard-hero-visual">

//             <img
//               src="/assets/hero-workers.png"
//               alt="Supplybase service professionals"
//             />

//           </div>

//         </div>


//         {/* FLOATING GOLD CTA */}
//         <div className="dashboard-hero-bar">

//           <div className="dashboard-hero-bar-text">

//             <strong>
//               JOIN SUPPLYBASE AS A SERVICE PROFESSIONAL
//             </strong>

//             <span>
//               Share your WhatsApp number and we'll reach out to you.
//             </span>

//           </div>


//           <form
//             className="dashboard-hero-bar-form"
//             onSubmit={(e) => {
//               e.preventDefault();

//               const phone = e.target.phone.value.trim();

//               if (!phone) return;

//               window.open(
//                 `https://wa.me/918356928520.?text=${encodeURIComponent(
//                   `Hi Supplybase, I'm interested in joining as a service professional. My number is ${phone}.`
//                 )}`,
//                 '_blank'
//               );

//               e.target.reset();
//             }}
//           >

//             <div className="dashboard-hero-prefix">
//               <span>IN</span>
//               <strong>+91</strong>
//               <span className="prefix-arrow">⌄</span>
//             </div>

//             <input
//               type="tel"
//               name="phone"
//               placeholder="Enter WhatsApp number"
//               inputMode="numeric"
//               pattern="[0-9]{10}"
//               maxLength="10"
//               required
//             />

//             <button
//               type="submit"
//               className="dashboard-hero-join"
//             >
//               Join Us
//             </button>

//           </form>

//         </div>

//       </section>

//     </div>
//   );
// }


import { useAuth } from '../context/AuthContext';
import '../styles/partnerDashboard.css';

export default function Dashboard() {
  const { user } = useAuth();

  const firstName =
    (user?.fullName || '').split(' ')[0] || 'Partner';

  return (
    <div className="dashboard-page">

      <section className="dashboard-hero">

        <div className="dashboard-hero-inner">

          {/* LEFT SIDE */}
          <div className="dashboard-hero-copy">

            <span className="dashboard-hero-eyebrow">
              SUPPLYBASE PARTNERS
            </span>

            <h1 className="dashboard-hero-title">
              EARN MORE.
              <br />

              EARN RESPECT.
              <br />

              <span className="dashboard-hero-highlight">
                BUILD YOUR FUTURE.
              </span>
            </h1>

            <p className="dashboard-hero-sub">
              Join Supplybase as a service professional and get access to
              genuine projects, reliable work opportunities and a growing
              customer network.
            </p>

            <ul className="dashboard-hero-checks">

              <li>
                <span className="dashboard-check">✓</span>
                <span>More project opportunities</span>
              </li>

              <li>
                <span className="dashboard-check">✓</span>
                <span>Transparent work process</span>
              </li>

              <li>
                <span className="dashboard-check">✓</span>
                <span>Professional support</span>
              </li>

            </ul>

          </div>


          {/* RIGHT SIDE IMAGE */}
          <div className="dashboard-hero-visual">

            <img
              src="/assets/hero-workers.png"
              alt="Supplybase service professionals"
            />

          </div>

        </div>


        {/* FLOATING GOLD CTA */}
        <div className="dashboard-hero-bar">

          <div className="dashboard-hero-bar-text">

            <strong>
              JOIN SUPPLYBASE AS A SERVICE PROFESSIONAL
            </strong>

            <span>
              Share your WhatsApp number and we'll reach out to you.
            </span>

          </div>


          <form
            className="dashboard-hero-bar-form"
            onSubmit={(e) => {
              e.preventDefault();

              const phone = e.target.phone.value.trim();

              if (!phone) return;

              window.open(
                `https://wa.me/918356928520?text=${encodeURIComponent(
                  `Hi Supplybase, I'm interested in joining as a service professional. My number is ${phone}.`
                )}`,
                '_blank'
              );

              e.target.reset();
            }}
          >

            <div className="dashboard-hero-prefix">
              <span>IN</span>
              <strong>+91</strong>
              <span className="prefix-arrow">⌄</span>
            </div>

            <input
              type="tel"
              name="phone"
              placeholder="Enter WhatsApp number"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength="10"
              required
            />

            <button
              type="submit"
              className="dashboard-hero-join"
            >
              Join Us
            </button>

          </form>

        </div>

      </section>

    </div>
  );
}
