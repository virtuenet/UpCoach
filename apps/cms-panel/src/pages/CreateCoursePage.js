import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
export default function CreateCoursePage() {
    const navigate = useNavigate();
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("div", { className: "mb-6", children: _jsxs("button", { onClick: () => navigate('/courses'), className: "flex items-center text-gray-600 hover:text-gray-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }), "Back to Courses"] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Create New Course" }), _jsx("p", { className: "text-gray-500", children: "Course builder functionality coming soon..." })] })] }));
}
//# sourceMappingURL=CreateCoursePage.js.map