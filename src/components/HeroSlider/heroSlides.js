/**
 * SUPPLYBASE HERO SLIDES
 *
 * The four banners are approved, finished artwork: every heading, the ₹25
 * card and the BOOK NOW button are painted into the image. Nothing here
 * re-renders any of that in HTML — the image is the slide.
 *
 * `hotspot` is the BOOK NOW button's position inside the artwork, measured
 * from the 1672x941 originals and stored as percentages. Percentages rather
 * than pixels because the image is fluid: the button has to stay under the
 * cursor at every width, and a percentage box scales with the picture while a
 * pixel box would drift off it.
 *
 * `mobileImage` is deliberately supported but not yet supplied — see the note
 * in HeroSlider.css about what these landscape banners do on a phone.
 */
export const heroSlides = [
  {
    id: 'interior',
    image: '/assets/hero/interior-design.png',
    alt: 'Supplybase Interior Design Service',
    route: '/booking/interior-work',
    bookLabel: 'Book Interior Design Service',
    // bottom-left pill
    hotspot: { left: 1.8, top: 83.5, width: 20.2, height: 8.2 },
  },
  {
    id: 'plumbing',
    image: '/assets/hero/plumbing.png',
    alt: 'Supplybase Plumbing Service',
    route: '/booking/plumbing',
    bookLabel: 'Book Plumbing Service',
    hotspot: { left: 2.4, top: 86.8, width: 21.6, height: 8.6 },
  },
  {
    id: 'painting',
    image: '/assets/hero/painting.png',
    alt: 'Supplybase Painting Service',
    route: '/booking/painting-waterproofing',
    bookLabel: 'Book Painting and Waterproofing Service',
    hotspot: { left: 1.8, top: 87.6, width: 18.6, height: 7.6 },
  },
  {
    id: 'electrician',
    image: '/assets/hero/electrical.png',
    alt: 'Supplybase Electrical Service',
    route: '/booking/electrician',
    bookLabel: 'Book Electrical Service',
    // this one sits inside the dark card on the right, not bottom-left
    hotspot: { left: 77.4, top: 68.8, width: 18.2, height: 7.6 },
  },
];

/** How long each slide holds before advancing. */
export const AUTOPLAY_MS = 5500;

export default heroSlides;
