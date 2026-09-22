import { useState } from 'react';

export default function useServiceBookingModal() {
  const [service, setService] = useState(null);
  const [openToken, setOpenToken] = useState(0);

  return {
    service,
    openToken,
    open: (nextService) => {
      setService(nextService);
      setOpenToken((token) => token + 1);
    },
    close: () => setService(null),
  };
}
