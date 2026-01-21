import React, { useState } from 'react';
import { Button } from '../common/Button';

export interface ReviewModalProps {
  action: 'approve' | 'request_changes' | null;
  onSubmit: (status: 'approved' | 'changes_requested') => void;
  onCancel: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  action,
  onSubmit,
  onCancel,
}) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    onSubmit(action === 'approve' ? 'approved' : 'changes_requested');
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-400">
        {action === 'approve'
          ? 'You are about to approve this code review.'
          : 'You are requesting changes to this code review.'}
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={
            action === 'approve'
              ? 'LGTM! \uD83C\uDF89'
              : 'Please address the following...'
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={submitting}
          className={
            action === 'approve'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-orange-600 hover:bg-orange-700'
          }
        >
          {action === 'approve' ? 'Approve' : 'Request Changes'}
        </Button>
      </div>
    </div>
  );
};
