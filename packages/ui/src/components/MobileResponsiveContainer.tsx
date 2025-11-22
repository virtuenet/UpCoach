import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

export interface MobileResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const MobileResponsiveContainer: React.FC<MobileResponsiveContainerProps> = ({
  children,
  className,
  breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
  },
}) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < breakpoints.mobile!) {
        setDeviceType('mobile');
      } else if (width < breakpoints.tablet!) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }

      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoints]);

  return (
    <div
      className={clsx(
        'responsive-container',
        `device-${deviceType}`,
        `orientation-${orientation}`,
        className
      )}
      data-device={deviceType}
      data-orientation={orientation}
    >
      {children}
    </div>
  );
};

// Touch-enabled Card component
export interface TouchCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  className?: string;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  className,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    } else if (Math.abs(distance) < 10 && onTap) {
      onTap();
    }
  };

  return (
    <div
      className={clsx('touch-card', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};

// Responsive Grid component
export interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  gap = 4,
  className,
}) => {
  return (
    <div
      className={clsx(
        'grid',
        `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
};

// Mobile Navigation component
export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.FC;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
}

export interface MobileNavigationProps {
  items: MobileNavItem[];
  position?: 'top' | 'bottom';
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  position = 'bottom',
  className,
}) => {
  return (
    <nav
      className={clsx(
        'fixed left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50',
        position === 'bottom' ? 'bottom-0' : 'top-0',
        'sm:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={clsx(
              'flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative',
              item.active
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            <item.icon />
            <span className="text-xs mt-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Collapsible mobile section
export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx('collapsible-section', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        <svg
          className={clsx(
            'w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

// Floating Action Button
export interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.FC;
  label?: string;
  position?: {
    bottom?: number;
    right?: number;
  };
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon: Icon,
  label,
  position = { bottom: 20, right: 20 },
  className,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
      }}
      className={clsx(
        'fixed z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 sm:hidden',
        className
      )}
      aria-label={label}
    >
      <Icon />
    </button>
  );
};

// Pull to refresh component
export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStart;

    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      className={clsx('pull-to-refresh relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all"
          style={{
            height: `${pullDistance}px`,
            marginTop: `-${pullDistance}px`,
          }}
        >
          {isRefreshing ? (
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className={clsx(
                'h-6 w-6 transition-transform',
                pullDistance > threshold ? 'text-blue-600 rotate-180' : 'text-gray-400'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default MobileResponsiveContainer;