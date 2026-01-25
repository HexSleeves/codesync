import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';

export const SessionNotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Session Not Found</h1>
        <p className="text-gray-400 mb-6">This session doesn't exist or you don't have access.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </div>
  );
};
