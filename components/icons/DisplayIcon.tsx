
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Fix: Add className to IconProps
  className?: string;
}

const DisplayIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h4.757c3.286 0 5.963 2.005 6.859 4.795L21 5.25z" />
  </svg>
);

export default DisplayIcon;
