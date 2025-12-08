import React, { useEffect } from 'react';

export default function Notification({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
  const iconColor = type === 'error' ? 'text-red-600' : 'text-green-600';
  const buttonColor = type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      />
      <div className={`relative ${bgColor} border rounded-lg shadow-lg p-6 max-w-md w-full`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${iconColor}`}>
            {type === 'error' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className={`text-base font-medium ${textColor}`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`${buttonColor} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

