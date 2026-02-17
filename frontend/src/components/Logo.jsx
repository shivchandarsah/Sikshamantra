import React from 'react';
import SikshaMantraLogo from '../assets/siksha-mantra-logo.svg';
import SikshaMantraHorizontal from '../assets/siksha-mantra-horizontal.svg';
import SikshaMantraIcon from '../assets/siksha-mantra-icon.svg';

const Logo = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  textClassName = '',
  iconOnly = false,
  horizontal = false 
}) => {
  const sizes = {
    sm: { 
      width: 90, height: 20, 
      iconWidth: 20, iconHeight: 20, 
      horizontalWidth: 90, horizontalHeight: 20,
      textSize: 'text-sm' 
    },
    md: { 
      width: 120, height: 36, 
      iconWidth: 36, iconHeight: 36, 
      horizontalWidth: 120, horizontalHeight: 26,
      textSize: 'text-lg' 
    },
    lg: { 
      width: 160, height: 48, 
      iconWidth: 48, iconHeight: 48, 
      horizontalWidth: 160, horizontalHeight: 35,
      textSize: 'text-2xl' 
    },
    xl: { 
      width: 200, height: 60, 
      iconWidth: 60, iconHeight: 60, 
      horizontalWidth: 180, horizontalHeight: 40,
      textSize: 'text-3xl' 
    }
  };

  const { width, height, iconWidth, iconHeight, horizontalWidth, horizontalHeight, textSize } = sizes[size] || sizes.md;

  if (iconOnly) {
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={SikshaMantraIcon} 
          alt="Siksha Mantra" 
          width={iconWidth} 
          height={iconHeight}
          className="flex-shrink-0"
        />
      </div>
    );
  }

  if (horizontal || !showText) {
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={horizontal ? SikshaMantraHorizontal : SikshaMantraIcon} 
          alt="Siksha Mantra - Learn, Grow, Excel" 
          width={horizontal ? horizontalWidth : iconWidth} 
          height={horizontal ? horizontalHeight : iconHeight}
          className="flex-shrink-0"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={SikshaMantraLogo} 
        alt="Siksha Mantra - Learn, Grow, Excel" 
        width={width} 
        height={height}
        className="flex-shrink-0"
      />
    </div>
  );
};

export default Logo;