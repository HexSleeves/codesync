import React from 'react';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  sidebarWidth: number;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle, sidebarWidth }) => (
  <button
    onClick={onToggle}
    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-gray-700 hover:bg-gray-600 rounded-l-lg text-gray-400 z-10"
    style={{ right: isOpen ? `${sidebarWidth}px` : '0' }}
  >
    <svg
      className={`w-5 h-5 transition-transform ${isOpen ? '' : 'rotate-180'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);
