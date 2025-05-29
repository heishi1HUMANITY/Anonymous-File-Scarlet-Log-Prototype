
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  active?: boolean; 
}

const WifiIcon: React.FC<IconProps> = ({ active, className, style, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" // Base color is currentColor, to be overridden by CSS var
    className={`${className} ${active === false ? 'opacity-50' : ''}`} 
    style={{ 
        color: active ? 'var(--palette-icon-active)' : 'var(--palette-icon-default)',
        ...style // Allow overriding or adding styles
    }}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.75 20.25h.008v.008h-.008v-.008z" />
  </svg>
);

export default WifiIcon;