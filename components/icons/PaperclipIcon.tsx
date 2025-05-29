import React from 'react';

interface IconProps {
  className?: string;
}

export const PaperclipIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5} // Default stroke-width, can be overridden by className if Tailwind is configured for it
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 1112.81 7.394l-10.94 10.94a1.125 1.125 0 11-1.59-1.591l10.94-10.94a3.375 3.375 0 014.773 0c1.312 1.312 1.312 3.455 0 4.773l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l7.693-7.693"
      />
    </svg>
  );
};

export default PaperclipIcon;
