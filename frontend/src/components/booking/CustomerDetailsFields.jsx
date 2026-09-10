export function Field({ id, label, required, hint, error, ...rest }) {
  return (
    <div className={`field ${error ? 'error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      <input id={id} {...rest} />
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </div>
  );
}

/** The name/phone/whatsapp/email/address/city/pincode fields shared by every
    booking flow (ServiceBooking's own wizard, plus the plumbing checkout and
    consultation booking flows) — one copy of the markup, reused. */
export default function CustomerDetailsFields({ details, setDetail, errors, idPrefix = 'bk' }) {
  return (
    <>
      <div className="form-grid">
        <Field id={`${idPrefix}-name`} label="Full Name" required value={details.name}
               onChange={setDetail('name')} error={errors.name}
               placeholder="Enter your name" />
        <Field id={`${idPrefix}-phone`} label="Mobile Number" required type="tel"
               inputMode="numeric" value={details.phone}
               onChange={setDetail('phone')} error={errors.phone}
               placeholder="Enter mobile number" />
        <Field id={`${idPrefix}-whatsapp`} label="WhatsApp Number (Optional)" type="tel"
               inputMode="numeric" value={details.whatsapp}
               onChange={setDetail('whatsapp')} error={errors.whatsapp}
               placeholder="Enter WhatsApp number"
               hint="Leave blank if it is the same as your mobile." />
        <Field id={`${idPrefix}-email`} label="Email Address (Optional)" type="email"
               value={details.email} onChange={setDetail('email')}
               error={errors.email} placeholder="Enter email address" />
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label htmlFor={`${idPrefix}-address`}>
          Project Address <span className="req">*</span>
        </label>
        <textarea id={`${idPrefix}-address`} rows={3} value={details.address}
                  onChange={setDetail('address')}
                  placeholder="Enter complete address" />
        {errors.address && <span className="field-error">{errors.address}</span>}
      </div>

      <div className="form-grid" style={{ marginTop: 16 }}>
        <Field id={`${idPrefix}-city`} label="City" required value={details.city}
               onChange={setDetail('city')} error={errors.city}
               placeholder="Mumbai" />
        <Field id={`${idPrefix}-pincode`} label="Pincode" value={details.pincode}
               onChange={setDetail('pincode')} error={errors.pincode}
               placeholder="400001" />
      </div>
    </>
  );
}
