import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { wpBathroomServices } from '../data/waterproofingContent';

/**
 * Bathroom Waterproofing opens the floor flow directly.
 */
export default function WaterproofingBathroom({
  modal = false,
  onSelectService,
}) {
  const floorRoute = wpBathroomServices.find(
    (service) => service.slug === 'bathroom-floor'
  )?.route || '/services/waterproofing/bathroom-floor';

  useEffect(() => {
    if (modal && onSelectService) {
      onSelectService(floorRoute);
    }
  }, [modal, onSelectService, floorRoute]);

  if (modal) return null;

  return <Navigate to={floorRoute} replace />;
}
