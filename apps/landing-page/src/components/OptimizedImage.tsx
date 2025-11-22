'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  quality = 75,
  sizes,
  fill = false,
  style,
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);

  // Generate a low-quality placeholder if blurDataURL is not provided
  const defaultBlurDataURL =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    // Fallback image
    setImgSrc('/placeholder-image.png');
  };

  if (fill) {
    return (
      <div className={`relative ${className}`} style={style}>
        <Image
          src={imgSrc}
          alt={alt}
          fill
          quality={quality}
          sizes={sizes || '100vw'}
          className={`${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={handleError}
          placeholder={placeholder}
          blurDataURL={blurDataURL || defaultBlurDataURL}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 1200}
      height={height || 630}
      quality={quality}
      sizes={sizes}
      className={`${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
      onLoad={() => {
        setIsLoading(false);
        onLoad?.();
      }}
      onError={handleError}
      placeholder={placeholder}
      blurDataURL={blurDataURL || defaultBlurDataURL}
      priority={priority}
      style={style}
    />
  );
}
