'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
export default function VideoModal({ isOpen, onClose, videoUrl = 'https://www.youtube.com/embed/your-demo-video-id', }) {
    const modalRef = useRef(null);
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm", onClick: handleBackdropClick, children: _jsxs(motion.div, { ref: modalRef, initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, transition: { type: 'spring', damping: 30, stiffness: 300 }, className: "relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl", children: [_jsx("button", { onClick: onClose, className: "absolute top-4 right-4 z-10 p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors duration-300 group", "aria-label": "Close video", children: _jsx(X, { className: "w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" }) }), _jsx("div", { className: "relative w-full h-full", children: _jsx("iframe", { src: `${videoUrl}?autoplay=1&rel=0&showinfo=0&modestbranding=1`, title: "UpCoach Demo Video", className: "absolute inset-0 w-full h-full", frameBorder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true }) })] }) })) }));
}
//# sourceMappingURL=VideoModal.js.map