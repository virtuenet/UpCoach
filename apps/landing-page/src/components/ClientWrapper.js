'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ExperimentDashboard from '@/components/experiments/ExperimentDashboard';
import LeadCaptureModal from '@/components/forms/LeadCaptureModal';
import { ExperimentProvider } from '@/components/providers/ExperimentProvider';
export default function ClientWrapper({ children }) {
    return (_jsxs(ExperimentProvider, { children: [children, _jsx(LeadCaptureModal, { trigger: "time-based", delay: 30 }), _jsx(ExperimentDashboard, {})] }));
}
//# sourceMappingURL=ClientWrapper.js.map