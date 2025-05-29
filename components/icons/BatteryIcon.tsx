
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Fix: Add className to IconProps
  className?: string;
}

const BatteryIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5V6.75A2.25 2.25 0 0018.75 4.5h-15A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 19.5h15a2.25 2.25 0 002.25-2.25V13.5A2.25 2.25 0 0018.75 11.25H18.75A2.25 2.25 0 0116.5 9V8.25a2.25 2.25 0 012.25-2.25h.008a2.25 2.25 0 012.25 2.25v.008H21zM16.5 11.25L18.75 11.25" />
  </svg>
);

export default BatteryIcon;
