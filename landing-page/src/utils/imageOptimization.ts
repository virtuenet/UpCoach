/**
 * Generate responsive image sizes for Next.js Image component
 */
export function generateImageSizes(viewportPercentage: number = 100): string {
  // Common device widths
  const deviceWidths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

  return deviceWidths
    .map(
      (width) =>
        `(max-width: ${width}px) ${Math.round((width * viewportPercentage) / 100)}px`,
    )
    .join(", ");
}

/**
 * Generate blur data URL for placeholder
 */
export async function generateBlurDataURL(imagePath: string): Promise<string> {
  // This is a placeholder implementation
  // In production, you would use a library like plaiceholder
  return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";
}

/**
 * Optimize image loading based on viewport
 */
export function getImagePriority(
  position: "above-fold" | "below-fold",
): boolean {
  return position === "above-fold";
}

/**
 * Get optimized image format based on browser support
 */
export function getOptimizedFormat(originalFormat: string): string {
  // Check for WebP support
  if (typeof window !== "undefined" && window.document) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const isWebPSupported =
      canvas.toDataURL("image/webp").indexOf("image/webp") === 0;

    if (isWebPSupported) {
      return "webp";
    }
  }

  // Check for AVIF support (for modern browsers)
  if (typeof window !== "undefined" && "Image" in window) {
    const avifTest = new Image();
    avifTest.src =
      "data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAAPBtZXRhAAAAAAAAAChoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAbGliYXZpZgAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAEUAAAAKAAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABoaXBycAAAAElpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAABCAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=";
    if (avifTest.complete && avifTest.naturalHeight > 0) {
      return "avif";
    }
  }

  return originalFormat;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, as: "image" = "image"): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(() => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = as;
      link.href = src;
      document.head.appendChild(link);
    });
  }
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(): void {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return;
  }

  const images = document.querySelectorAll("img[data-lazy]");

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute("data-lazy");
          if (src) {
            img.src = src;
            img.removeAttribute("data-lazy");
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    },
  );

  images.forEach((img) => imageObserver.observe(img));
}
