import React from 'react';
import { CompanyLogo } from './CompanyLogo';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const DdbLogo: React.FC<LogoProps> = ({ className = 'w-10 h-10', size }) => {
  return <CompanyLogo className={className} size={size} />;
};

