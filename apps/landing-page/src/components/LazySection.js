'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export default function LazySection({ children, className = '', threshold = 0.1, rootMargin = '50px', fallback = _jsx("div", { className: "h-96 bg-gray-50 animate-pulse rounded-xl" }), }) {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                // Once visible, we can disconnect the observer
                observer.disconnect();
            }
        }, {
            threshold,
            rootMargin,
        });
        const currentRef = sectionRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }
        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [threshold, rootMargin]);
    return (_jsx("div", { ref: sectionRef, className: className, children: isVisible ? children : fallback }));
}
//# sourceMappingURL=LazySection.js.map