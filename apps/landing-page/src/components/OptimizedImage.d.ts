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
export default function OptimizedImage({ src, alt, width, height, className, priority, placeholder, blurDataURL, quality, sizes, fill, style, onLoad, }: OptimizedImageProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=OptimizedImage.d.ts.map