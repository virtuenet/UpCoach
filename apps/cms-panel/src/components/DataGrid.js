import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function DataGrid({ data, columns }) {
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full border-collapse", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b", children: columns?.map((col) => (_jsx("th", { className: "text-left p-2", children: col.header }, col.key))) }) }), _jsx("tbody", { children: data?.map((row, i) => (_jsx("tr", { className: "border-b", children: columns?.map((col) => (_jsx("td", { className: "p-2", children: row[col.key] }, col.key))) }, i))) })] }) }));
}
//# sourceMappingURL=DataGrid.js.map