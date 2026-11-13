import React from 'react';

const Skeleton = ({ className = '', count = 1 }) => {
  if (count === 1) {
    return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
      ))}
    </div>
  );
};

export default Skeleton;

