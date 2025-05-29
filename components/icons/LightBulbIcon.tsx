
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const LightBulbIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.354a15.054 15.054 0 01-4.5 0M3 10.5h18M4.5 3v.75A.75.75 0 013.75 4.5h-.75A.75.75 0 012.25 3V3m19.5 0v.75a.75.75 0 00.75.75h.75a.75.75 0 00.75-.75V3m-1.5-1.5h-15a.75.75 0 00-.75.75v.75A.75.75 0 003.75 3h15a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75z" />
  </svg>
);
// This is the same as FlashlightIcon, can be used for IdeaPad or similar "idea" concepts.

export default LightBulbIcon;