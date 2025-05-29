
import React from 'react';

// Fix: Add className to IconProps
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

const CameraIconSolid: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path fillRule="evenodd" d="M.664 6.588A1.5 1.5 0 012.162 5.5h1.386a1.5 1.5 0 011.407.976l.412 1.03A1.5 1.5 0 006.777 8.5h6.446a1.5 1.5 0 001.407-1.006l.412-1.03A1.5 1.5 0 0116.453 5.5h1.386a1.5 1.5 0 011.498 1.088l.503 1.254a1.5 1.5 0 01-.23 1.65l-2.428 2.833A1.501 1.501 0 0016.5 13H3.5a1.5 1.5 0 00-1.088-.422L.05 9.732a1.5 1.5 0 01.614-3.144zM0 14a1.5 1.5 0 01.992-1.412l2.442-1.15A1.5 1.5 0 014.5 11.5h11a1.5 1.5 0 011.066.438l2.442 1.15A1.5 1.5 0 0120 14v2.5a1.5 1.5 0 01-1.5 1.5H1.5A1.5 1.5 0 010 16.5V14z" clipRule="evenodd" />
  </svg>
);

export default CameraIconSolid;
