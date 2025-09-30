import React from 'react';

export interface SpinnerProps {
  size?: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  className?: string;
  ariaLabel?: string;
}

const Spinner = ({
  size = 100,
  color = '#000000', // blue-500
  borderColor = '#ffffff', // gray-300
  borderWidth = 3,
  className = '',
  ariaLabel = 'Loading',
}: SpinnerProps) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderStyle: 'solid',
    borderWidth: borderWidth,
    borderColor: borderColor,
    borderTopColor: color,
    borderRadius: '50%',
    boxSizing: 'border-box',
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`inline-block ${className} animate-spin`}
      style={style}
    />
  );
};

export default Spinner;