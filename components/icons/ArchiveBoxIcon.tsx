import React from 'react';

interface IconProps {
  className?: string;
}

export const ArchiveBoxIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5} // Default stroke-width
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 8.25h13.5m-13.5 0a2.25 2.25 0 01-2.25-2.25V3.75c0-1.242 1.008-2.25 2.25-2.25h13.5c1.242 0 2.25 1.008 2.25 2.25v2.25c0 1.242-1.008 2.25-2.25 2.25m-13.5 0V18a2.25 2.25 0 002.25 2.25h9A2.25 2.25 0 0018.75 18V8.25m-13.5 0h13.5"
      />
    </svg>
  );
};

export default ArchiveBoxIcon;
