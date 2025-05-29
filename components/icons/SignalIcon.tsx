
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Fix: Add className to IconProps
  className?: string;
}

const SignalIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12.003C3 12.003 5.99991 10.0254 7.49987 10.0254C8.99984 10.0254 12 12.003 12 12.003M3 12.003V17.003C3 17.003 5.99991 15.0254 7.49987 15.0254C8.99984 15.0254 12 17.003 12 17.003V12.003M3 12.003L7.49987 7.00302C8.99984 7.00302 12 5.00299 12 5.00299M12 12.003V5.00299M12 12.003L16.5001 7.00302C18.0001 7.00302 21 5.00299 21 5.00299M12 12.003L16.5001 17.003C18.0001 17.003 21 19.003 21 19.003V5.00299M21 5.00299L16.5001 10.0254M12 5.00299L7.49987 10.0254" />
  </svg>
);

export default SignalIcon;
