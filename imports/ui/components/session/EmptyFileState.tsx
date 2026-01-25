import React from 'react';

export const EmptyFileState: React.FC = () => (
  <div className="flex items-center justify-center h-full text-gray-500">
    <div className="text-center">
      <svg
        className="w-16 h-16 mx-auto mb-4 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-lg">Select a file to review</p>
      <p className="text-sm mt-2">Choose a file from the sidebar to start reviewing</p>
    </div>
  </div>
);
