
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Fix: Add className to IconProps
  className?: string;
}

const BluetoothIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.75l10.5 10.5-4.33 4.33-1.17-1.17a2.25 2.25 0 010-3.182l1.17-1.17-4.33-4.33L6.75 7.75zm0 0l10.5-3L12.75 0M6.75 7.75L0 13.5l4.5 4.5" />
  </svg>
);

export default BluetoothIcon;
