import React from 'react';
import { GitHubIcon } from '../../common/icons/GitHubIcon';

type SourceType = 'manual' | 'github';

interface SourceTypeSelectorProps {
  value: SourceType;
  onChange: (type: SourceType) => void;
}

export const SourceTypeSelector: React.FC<SourceTypeSelectorProps> = ({ value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Source
    </label>
    <div className="grid grid-cols-2 gap-4">
      <SourceOption
        selected={value === 'manual'}
        onClick={() => onChange('manual')}
        title="Upload Files"
        description="Drag and drop or paste code"
      />

      <SourceOption
        selected={value === 'github'}
        onClick={() => onChange('github')}
        title="GitHub PR"
        description="Import from pull request"
        icon={<GitHubIcon className="w-5 h-5" />}
      />
    </div>
  </div>
);

interface SourceOptionProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const SourceOption: React.FC<SourceOptionProps> = ({
  selected,
  onClick,
  title,
  description,
  icon,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-4 border rounded-lg text-left transition-colors ${
      selected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
    }`}
  >
    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
      {icon}
      {title}
    </div>
    <div className="text-sm text-gray-500">{description}</div>
  </button>
);
