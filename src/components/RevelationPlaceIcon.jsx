import React from 'react';

const KaabaIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    title="Makkah"
  >
    {/* Kaaba - simple black silhouette */}
    <g>
      {/* Main building outline */}
      <path d="M4 6L12 2L20 6V18H4V6Z" fill="none" stroke="currentColor" strokeWidth="1.5" />

      {/* Door */}
      <rect x="11" y="12" width="2" height="4" fill="currentColor" />

      {/* Decorative drape lines */}
      <path d="M8 8L16 8" stroke="currentColor" strokeWidth="1" />
      <path d="M7 11L17 11" stroke="currentColor" strokeWidth="1" />
    </g>
  </svg>
);

const PalmTreeIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    title="Madinah"
  >
    {/* Palm tree - simple silhouette */}
    <g>
      {/* Trunk */}
      <rect x="10" y="14" width="4" height="8" fill="currentColor" />

      {/* Palm fronds */}
      <path d="M12 14C8 10 7 8 7 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M12 14C16 10 17 8 17 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M12 14C10 9 9 7 9 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M12 14C14 9 15 7 15 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M12 14L12 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

const RevelationPlaceIcon = ({ place, className = 'w-5 h-5', showLabel = false }) => {
  const isKaaba = place?.toLowerCase() === 'makkah';
  const isPalm = place?.toLowerCase() === 'madinah';

  return (
    <div className="flex items-center space-x-2">
      {isKaaba && <KaabaIcon className={className} />}
      {isPalm && <PalmTreeIcon className={className} />}
      {showLabel && <span className="text-xs">{place}</span>}
    </div>
  );
};

export { RevelationPlaceIcon, KaabaIcon, PalmTreeIcon };
export default RevelationPlaceIcon;
