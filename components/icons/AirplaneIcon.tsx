
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Fix: Add className to IconProps
  className?: string;
}

const AirplaneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
// Note: The original component had transform="rotate(45)" on the SVG element.
// This should be applied via className or style prop when using the component if still needed.
// Example: <AirplaneIcon className="w-6 h-6 transform rotate-45" />

export default AirplaneIcon;
