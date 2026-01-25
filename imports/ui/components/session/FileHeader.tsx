import React from 'react';
import { Meteor } from 'meteor/meteor';
import type { File } from '../../../api/files/files';

type ViewMode = 'code' | 'diff';
type DiffMode = 'unified' | 'split';

interface FileHeaderProps {
  file: File;
  viewMode: ViewMode;
  diffMode: DiffMode;
  onViewModeChange: (mode: ViewMode) => void;
  onDiffModeChange: (mode: DiffMode) => void;
  onShowKeyboardHelp: () => void;
}

export const FileHeader: React.FC<FileHeaderProps> = ({
  file,
  viewMode,
  diffMode,
  onViewModeChange,
  onDiffModeChange,
  onShowKeyboardHelp,
}) => {
  const handleToggleReviewed = () => {
    if (file.isReviewed) {
      Meteor.call('files.unmarkReviewed', file._id);
    } else {
      Meteor.call('files.markReviewed', file._id);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="font-mono text-sm font-medium text-gray-200 truncate">{file.path}</h2>

        {file.isReviewed && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Reviewed
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Mark as reviewed */}
        <button
          onClick={handleToggleReviewed}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            file.isReviewed
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
          }`}
        >
          {file.isReviewed ? 'Unmark reviewed' : 'Mark as reviewed'}
        </button>

        {/* View mode toggle */}
        <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />

        {/* Diff mode toggle (only shown in diff view) */}
        {viewMode === 'diff' && <DiffModeToggle mode={diffMode} onChange={onDiffModeChange} />}

        {/* Keyboard help button */}
        <button
          onClick={onShowKeyboardHelp}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
          title="Keyboard shortcuts (Shift+?)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Sub-components for toggle buttons
interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => (
  <div className="flex rounded-lg overflow-hidden border border-gray-600">
    <button
      onClick={() => onChange('code')}
      className={`px-3 py-1 text-sm transition-colors ${
        mode === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      Code
    </button>
    <button
      onClick={() => onChange('diff')}
      className={`px-3 py-1 text-sm transition-colors ${
        mode === 'diff' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      Diff
    </button>
  </div>
);

interface DiffModeToggleProps {
  mode: DiffMode;
  onChange: (mode: DiffMode) => void;
}

const DiffModeToggle: React.FC<DiffModeToggleProps> = ({ mode, onChange }) => (
  <div className="flex rounded-lg overflow-hidden border border-gray-600">
    <button
      onClick={() => onChange('unified')}
      className={`px-3 py-1 text-sm transition-colors ${
        mode === 'unified'
          ? 'bg-purple-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      title="Unified diff (press D)"
    >
      Unified
    </button>
    <button
      onClick={() => onChange('split')}
      className={`px-3 py-1 text-sm transition-colors ${
        mode === 'split'
          ? 'bg-purple-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      title="Split diff (press D)"
    >
      Split
    </button>
  </div>
);
