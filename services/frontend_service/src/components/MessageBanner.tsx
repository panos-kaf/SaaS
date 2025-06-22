import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

interface MessageBannerProps {
  type: 'success' | 'cancel' | 'error' | 'info';
  text: string;
  duration?: number;
  onClose: () => void;
}

const MessageBanner: React.FC<MessageBannerProps> = ({ type, text, duration = 3000, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const step = 100 / (duration / 100);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  return (
    <div
      className={clsx(
        'fixed top-20 right-4 z-50 w-[300px] px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300',
        {
          'bg-green-600': type === 'success',
          'bg-yellow-500': type === 'cancel',
          'bg-red-600': type === 'error',
          'bg-blue-500': type === 'info',
        }
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <span>{text}</span>
        <button onClick={onClose} className="text-xl font-bold hover:opacity-70 leading-none">×</button>
      </div>
      <div className="h-1 bg-white/30 mt-2 rounded overflow-hidden">
        <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default MessageBanner;