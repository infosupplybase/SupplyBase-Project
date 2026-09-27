import { createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * THE BOOKING POP-UP'S BUTTON BAR
 *
 * Inside the booking pop-up, a form's Back / Continue bar is drawn in the
 * pop-up's own footer — a fixed strip under the scrolling area, like the
 * header above it — instead of inside the scrolling content. The options and
 * photos scroll above it and never slide underneath the buttons, and the
 * buttons are always in the same place whatever the step.
 *
 * The pop-up provides the footer element through ModalFooterContext. On a
 * normal page there is none, and the bar renders in place as before.
 */
export const ModalFooterContext = createContext(null);

export default function ModalFoot({ className, children }) {
  const target = useContext(ModalFooterContext);
  const anchorRef = useRef(null);

  if (!target) {
    return <div className={className}>{children}</div>;
  }

  // Moved out of its <form> in the page, a submit button no longer submits
  // it on its own, so the click submits the form it belongs to.
  const submitOwnForm = (e) => {
    const button = e.target.closest('button');
    if (!button || button.type !== 'submit' || button.disabled) return;
    const form = anchorRef.current?.closest('form');
    if (!form) return;
    e.preventDefault();
    if (form.requestSubmit) {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  return (
    <>
      <span ref={anchorRef} hidden />
      {createPortal(
        <div className={className} onClick={submitOwnForm}>
          {children}
        </div>,
        target
      )}
    </>
  );
}
