import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface ActionFeedbackProps {
  isVisible: boolean;
  type: 'success' | 'error' | 'loading' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  isVisible,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (isVisible && autoClose && type !== 'loading') {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, type, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {title}
              </h4>
              {message && (
                <p className="mt-1 text-sm text-gray-600">
                  {message}
                </p>
              )}
            </div>
            {onClose && type !== 'loading' && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook pour gérer le feedback d'action
export const useActionFeedback = () => {
  const [feedback, setFeedback] = React.useState<{
    isVisible: boolean;
    type: 'success' | 'error' | 'loading' | 'info';
    title: string;
    message?: string;
  }>({
    isVisible: false,
    type: 'info',
    title: '',
  });

  const showFeedback = (
    type: 'success' | 'error' | 'loading' | 'info',
    title: string,
    message?: string
  ) => {
    setFeedback({
      isVisible: true,
      type,
      title,
      message,
    });
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, isVisible: false }));
  };

  const success = (title: string, message?: string) => {
    showFeedback('success', title, message);
  };

  const error = (title: string, message?: string) => {
    showFeedback('error', title, message);
  };

  const loading = (title: string, message?: string) => {
    showFeedback('loading', title, message);
  };

  const info = (title: string, message?: string) => {
    showFeedback('info', title, message);
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
    success,
    error,
    loading,
    info,
  };
};

export default ActionFeedback;







