
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const BookmarkIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c.1.121.176.26.224.407.07.216.054.452-.042.665l-2.693 8.552a.75.75 0 01-1.34.036l-2.086-5.215a.75.75 0 00-1.34-.036L7.09 12.945l-2.693-8.552c-.096-.213-.112-.449-.042-.665.048-.147.124-.286.224-.407.27-.332.68-.499 1.09-.42l10.082 2.161c.41.078.736.374.86.784zM10.5 14.25L12 18l1.5-3.75" />
  </svg>
);
// Using a slightly different bookmark icon than a simple filled one for variety.

export default BookmarkIcon;