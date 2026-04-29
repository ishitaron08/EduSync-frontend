export function NoiseOverlay() {
  return (
    <>
      <svg aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </>
  );
}
