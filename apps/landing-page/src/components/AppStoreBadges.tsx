'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface AppStoreBadgesProps {
  className?: string;
  variant?: 'default' | 'compact';
  animated?: boolean;
}

export default function AppStoreBadges({
  className = '',
  variant = 'default',
  animated = true,
}: AppStoreBadgesProps) {
  const badges = [
    {
      name: 'App Store',
      href: 'https://apps.apple.com/app/upcoach',
      svg: (
        <svg
          className="h-full w-full"
          viewBox="0 0 140 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="140" height="48" rx="8" fill="black" />
          <path
            d="M29.24 24.12c-.03-3.02 2.46-4.47 2.57-4.54-1.4-2.04-3.57-2.32-4.35-2.35-1.84-.19-3.61 1.09-4.55 1.09-.95 0-2.4-1.07-3.95-1.04-2.02.03-3.89 1.18-4.94 3.01-2.13 3.69-.54 9.13 1.51 12.12 1.02 1.46 2.22 3.1 3.79 3.04 1.53-.06 2.11-.98 3.96-.98 1.84 0 2.38.98 3.98.95 1.65-.03 2.68-1.48 3.67-2.95 1.17-1.69 1.65-3.34 1.67-3.43-.04-.01-3.2-1.23-3.23-4.87z"
            fill="white"
          />
          <path
            d="M26.16 14.65c.84-1.03 1.41-2.44 1.25-3.86-1.21.05-2.69.81-3.56 1.82-.78.9-1.47 2.35-1.29 3.73 1.37.1 2.76-.69 3.6-1.69z"
            fill="white"
          />
          <text
            x="45"
            y="20"
            fontSize="11"
            fill="white"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            Download on the
          </text>
          <text
            x="45"
            y="35"
            fontSize="18"
            fill="white"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            fontWeight="600"
          >
            App Store
          </text>
        </svg>
      ),
    },
    {
      name: 'Google Play',
      href: 'https://play.google.com/store/apps/details?id=com.upcoach.app',
      svg: (
        <svg
          className="h-full w-full"
          viewBox="0 0 140 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="140" height="48" rx="8" fill="black" />
          <path d="M20 12v24l10-12-10-12z" fill="url(#play-gradient1)" />
          <path d="M30 24l-10 12 16-8-6-4z" fill="url(#play-gradient2)" />
          <path d="M30 24l6-4-16-8 10 12z" fill="url(#play-gradient3)" />
          <path
            d="M20 36V12c0-.55.45-1 1-1 .19 0 .36.05.52.14L36 20l-16 16z"
            fill="url(#play-gradient4)"
          />
          <text
            x="45"
            y="20"
            fontSize="11"
            fill="white"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            GET IT ON
          </text>
          <text
            x="45"
            y="35"
            fontSize="18"
            fill="white"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            fontWeight="600"
          >
            Google Play
          </text>
          <defs>
            <linearGradient
              id="play-gradient1"
              x1="20"
              y1="12"
              x2="30"
              y2="24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00C9FF" />
              <stop offset="1" stopColor="#92FE9D" />
            </linearGradient>
            <linearGradient
              id="play-gradient2"
              x1="30"
              y1="24"
              x2="36"
              y2="20"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FC466B" />
              <stop offset="1" stopColor="#3F5EFB" />
            </linearGradient>
            <linearGradient
              id="play-gradient3"
              x1="30"
              y1="24"
              x2="36"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FDBB2D" />
              <stop offset="1" stopColor="#22C1C3" />
            </linearGradient>
            <linearGradient
              id="play-gradient4"
              x1="20"
              y1="12"
              x2="36"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F38181" />
              <stop offset="1" stopColor="#FCE38A" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
  ];

  const BadgeWrapper = animated ? motion.div : 'div';
  const badgeProps = animated
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }
    : {};

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        {badges.map(badge => (
          <BadgeWrapper key={badge.name} {...badgeProps}>
            <Link
              href={badge.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-10 w-32 transition-opacity hover:opacity-80"
              aria-label={`Download on ${badge.name}`}
            >
              {badge.svg}
            </Link>
          </BadgeWrapper>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {badges.map(badge => (
        <BadgeWrapper key={badge.name} {...badgeProps}>
          <Link
            href={badge.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-14 w-48 transition-all hover:shadow-lg"
            aria-label={`Download on ${badge.name}`}
          >
            {badge.svg}
          </Link>
        </BadgeWrapper>
      ))}
    </div>
  );
}
