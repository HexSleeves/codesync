import React, { useCallback } from 'react';
import { Meteor } from 'meteor/meteor';

interface FileUploaderProps {
  sessionId: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ sessionId }) => {
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = e.target.files;
      if (!uploadedFiles) return;

      Array.from(uploadedFiles).forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          const content = event.target?.result as string;
          const extension = file.name.split('.').pop() || '';

          Meteor.call('files.add', sessionId, {
            path: file.name,
            name: file.name,
            extension,
            size: file.size,
            content,
            encoding: 'utf-8',
            language: extension,
            isDeleted: false,
            isAdded: true,
            isModified: false,
            isRenamed: false,
          });
        };
        reader.readAsText(file);
      });
    },
    [sessionId]
  );

  return (
    <div className="p-4 border-t border-gray-700">
      <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-700/50 transition-colors">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        <span className="text-sm text-gray-400">Upload files</span>
        <input type="file" multiple onChange={handleFileUpload} className="hidden" />
      </label>
    </div>
  );
};
