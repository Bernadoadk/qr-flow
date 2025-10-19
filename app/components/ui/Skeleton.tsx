import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true,
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 ${rounded ? 'rounded-full' : 'rounded'}`;
  
  if (animate) {
    return (
      <motion.div
        className={`${baseClasses} ${className}`}
        style={{ width, height }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ width, height }}
    />
  );
};

// Predefined skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
    <Skeleton height="1.5rem" width="60%" className="mb-4" />
    <Skeleton height="1rem" className="mb-2" />
    <Skeleton height="1rem" width="80%" className="mb-4" />
    <div className="flex space-x-2">
      <Skeleton height="2rem" width="6rem" />
      <Skeleton height="2rem" width="6rem" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton height="2.5rem" width="2.5rem" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" width="40%" />
          <Skeleton height="0.75rem" width="60%" />
        </div>
        <Skeleton height="1.5rem" width="4rem" />
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${className}`}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <Skeleton height="1rem" width="50%" />
          <Skeleton height="2rem" width="2rem" rounded />
        </div>
        <Skeleton height="2rem" width="30%" className="mb-2" />
        <Skeleton height="0.75rem" width="40%" />
      </div>
    ))}
  </div>
);

export default Skeleton;





