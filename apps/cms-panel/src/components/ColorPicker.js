import { jsx as _jsx } from "react/jsx-runtime";
export default function ColorPicker({ color, onChange }) {
    return (_jsx("input", { type: "color", value: color, onChange: e => onChange?.(e.target.value), className: "w-full h-10 rounded border" }));
}
//# sourceMappingURL=ColorPicker.js.map