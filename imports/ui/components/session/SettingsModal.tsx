import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import type { Session } from '../../../api/sessions/collection';
import { Button } from '../common/Button';

export interface SettingsModalProps {
  session: Session;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  session,
  onClose,
}) => {
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || '');
  const [isPublic, setIsPublic] = useState(session.isPublic);
  const [diffMode, setDiffMode] = useState(session.settings.diffMode);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    Meteor.call(
      'sessions.update',
      session._id,
      {
        title,
        description,
        isPublic,
        settings: {
          ...session.settings,
          diffMode,
        },
      },
      (error: any) => {
        setSaving(false);
        if (!error) {
          onClose();
        }
      },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Diff Mode
        </label>
        <select
          value={diffMode}
          onChange={(e) => setDiffMode(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="unified">Unified</option>
          <option value="split">Split</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label
          htmlFor="isPublic"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Make this session public
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};
