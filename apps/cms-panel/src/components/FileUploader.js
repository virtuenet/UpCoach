import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function FileUploader({ onUpload }) {
    return (_jsxs("div", { className: "border-2 border-dashed rounded-lg p-8 text-center", children: [_jsx("input", { type: "file", onChange: e => onUpload?.(e.target.files) }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Click to upload files" })] }));
}
//# sourceMappingURL=FileUploader.js.map