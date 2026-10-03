import { createContext } from 'react';

export const ModalFooterContext = createContext(null);

export default function ModalFoot({ className, children }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}