'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { experiments, getActiveExperiments, clearExperiments } from '@/services/experiments';
import { motion } from 'framer-motion';
import { FlaskConical, RotateCcw } from 'lucide-react';
export default function ExperimentDashboard() {
    const [activeVariants, setActiveVariants] = useState({});
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        // Only show in development
        if (process.env.NODE_ENV === 'development') {
            setActiveVariants(getActiveExperiments());
            // Show dashboard with keyboard shortcut (Ctrl/Cmd + Shift + E)
            const handleKeyPress = (e) => {
                if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'E') {
                    setIsVisible(!isVisible);
                }
            };
            window.addEventListener('keydown', handleKeyPress);
            return () => window.removeEventListener('keydown', handleKeyPress);
        }
    }, [isVisible]);
    const handleReset = () => {
        clearExperiments();
        window.location.reload();
    };
    if (process.env.NODE_ENV !== 'development' || !isVisible) {
        return null;
    }
    return (_jsx(motion.div, { initial: { opacity: 0, x: 300 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 300 }, className: "fixed right-4 top-20 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center", children: _jsx(FlaskConical, { className: "w-5 h-5 text-purple-600" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "A/B Experiments" })] }), _jsx("button", { onClick: () => setIsVisible(false), className: "text-gray-400 hover:text-gray-600", children: "\u00D7" })] }), Object.entries(experiments).map(([id, experiment]) => {
                    const activeVariant = activeVariants[id];
                    const variant = experiment.variants.find(v => v.id === activeVariant);
                    return (_jsxs("div", { className: "mb-6 last:mb-0", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900", children: experiment.name }), _jsx("p", { className: "text-sm text-gray-500", children: experiment.description })] }), _jsx("span", { className: `text-xs px-2 py-1 rounded-full ${experiment.status === 'running'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'}`, children: experiment.status })] }), _jsx("div", { className: "space-y-2", children: experiment.variants.map(v => (_jsxs("div", { className: `flex items-center justify-between p-3 rounded-lg border ${v.id === activeVariant
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 bg-gray-50'}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${v.id === activeVariant ? 'bg-purple-500' : 'bg-gray-300'}` }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: v.name })] }), _jsxs("span", { className: "text-xs text-gray-500", children: [v.weight, "%"] })] }, v.id))) })] }, id));
                }), _jsxs("div", { className: "mt-6 pt-6 border-t border-gray-200", children: [_jsxs("button", { onClick: handleReset, className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), "Reset All Experiments"] }), _jsx("p", { className: "text-xs text-gray-500 text-center mt-2", children: "Press Cmd+Shift+E to toggle this panel" })] })] }) }));
}
//# sourceMappingURL=ExperimentDashboard.js.map