
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  // Fix: Add className to IconProps
  className?: string;
}

const SettingsIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.095.571.488 1.074.985 1.388l1.21.738c.549.334.884.959.884 1.612v2.273c0 .653-.335 1.278-.884 1.612l-1.21.738c-.497.314-.89.817-.985 1.388l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.095-.571-.488-1.074-.985-1.388l-1.21-.738c-.549-.334-.884-.959-.884-1.612V9.933c0-.653.335-1.278.884-1.612l1.21-.738c.497-.314-.89-.817-.985-1.388l.213-1.28z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default SettingsIcon;
