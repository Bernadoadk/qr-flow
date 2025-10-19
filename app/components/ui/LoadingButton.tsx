import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from './Button';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText = 'Chargement...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <Button
      disabled={disabled || loading}
      className={`relative ${className}`}
      {...props}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>{loadingText}</span>
        </motion.div>
      )}
      <motion.div
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className={loading ? 'invisible' : 'visible'}
      >
        {children}
      </motion.div>
    </Button>
  );
};

export default LoadingButton;


