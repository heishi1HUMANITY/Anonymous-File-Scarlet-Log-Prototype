
import React from 'react';

// Fix: Add className to IconProps
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

const PaperAirplaneIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
// This is the same path data as AirplaneIcon but used for a different semantic purpose (send).
// If specific rotation is needed, apply it via className or style prop.

export default PaperAirplaneIcon;
