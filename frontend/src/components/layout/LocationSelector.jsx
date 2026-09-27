// import { useEffect, useRef, useState } from 'react';
// import Icon from '../ui/Icon';
// import { useLocationContext } from '../../context/LocationContext';
// import GoogleLocationPicker from './GoogleLocationPicker';

// export default function LocationSelector() {
//   const {
//     location,
//     setLocation,
//     serviceAreas,
//   } = useLocationContext();

//   const [open, setOpen] = useState(false);
//   const [googlePickerOpen, setGooglePickerOpen] =
//     useState(false);

//   const ref = useRef(null);

//   useEffect(() => {
//     if (!open) return undefined;

//     const onDocClick = (event) => {
//       if (
//         ref.current &&
//         !ref.current.contains(event.target)
//       ) {
//         setOpen(false);
//       }
//     };

//     const onKey = (event) => {
//       if (event.key === 'Escape') {
//         setOpen(false);
//       }
//     };

//     document.addEventListener(
//       'mousedown',
//       onDocClick
//     );

//     document.addEventListener(
//       'keydown',
//       onKey
//     );

//     return () => {
//       document.removeEventListener(
//         'mousedown',
//         onDocClick
//       );

//       document.removeEventListener(
//         'keydown',
//         onKey
//       );
//     };
//   }, [open]);

//   const handleGoogleLocation = (
//     selectedLocation
//   ) => {
//     setLocation(selectedLocation);
//     setOpen(false);
//   };

//   return (
//     <>
//       <div
//         className="location-select"
//         ref={ref}
//       >
//         <button
//           type="button"
//           className="location-btn"
//           onClick={() =>
//             setOpen((value) => !value)
//           }
//           aria-haspopup="menu"
//           aria-expanded={open}
//         >
//           <Icon
//             name="map-pin"
//             size={16}
//           />

//           <span
//             className="location-btn-text"
//             title={location}
//           >
//             {location}
//           </span>

//           <Icon
//             name="chevron-down"
//             size={13}
//           />
//         </button>

//         {open && (
//           <div
//             className="location-menu"
//             role="menu"
//           >
//             <button
//               type="button"
//               className="location-google-option"
//               onClick={() => {
//                 setOpen(false);
//                 setGooglePickerOpen(true);
//               }}
//             >
//               <span className="location-google-icon">
//                 <Icon
//                   name="map-pin"
//                   size={18}
//                 />
//               </span>

//               <span>
//                 <strong>
//                   Search location
//                 </strong>

//                 <small>
//                   Search any area, street or landmark
//                 </small>
//               </span>
//             </button>

//             <div className="location-menu-divider" />

//             <p className="location-menu-title">
//               Popular service areas
//             </p>

//             {serviceAreas.map((area) => (
//               <button
//                 key={area}
//                 type="button"
//                 role="menuitem"
//                 className={
//                   area === location
//                     ? 'active'
//                     : ''
//                 }
//                 onClick={() => {
//                   setLocation(area);
//                   setOpen(false);
//                 }}
//               >
//                 <span>{area}</span>

//                 {area === location && (
//                   <Icon
//                     name="check"
//                     size={14}
//                     strokeWidth={3}
//                   />
//                 )}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       <GoogleLocationPicker
//         open={googlePickerOpen}
//         onClose={() =>
//           setGooglePickerOpen(false)
//         }
//         onSelect={handleGoogleLocation}
//       />
//     </>
//   );
// }



import { useState } from 'react';
import Icon from '../ui/Icon';
import { useLocationContext } from '../../context/LocationContext';
import GoogleLocationPicker from './GoogleLocationPicker';

export default function LocationSelector() {
  const { location, setLocation } =
    useLocationContext();

  const [googlePickerOpen, setGooglePickerOpen] =
    useState(false);

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setGooglePickerOpen(false);
  };

  return (
    <>
      <div className="location-select">
        <button
          type="button"
          className="location-btn"
          onClick={() =>
            setGooglePickerOpen(true)
          }
          aria-label="Select location"
        >
          <Icon
            name="map-pin"
            size={16}
          />

          <span
            className="location-btn-text"
            title={location}
          >
            {location}
          </span>

          <Icon
            name="chevron-down"
            size={13}
          />
        </button>
      </div>

      <GoogleLocationPicker
        open={googlePickerOpen}
        onClose={() =>
          setGooglePickerOpen(false)
        }
        onSelect={handleLocationSelect}
      />
    </>
  );
}