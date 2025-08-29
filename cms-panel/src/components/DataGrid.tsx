export default function DataGrid({ data, columns }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns?.map((col: any) => (
              <th key={col.key} className="text-left p-2">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row: any, i: number) => (
            <tr key={i} className="border-b">
              {columns?.map((col: any) => (
                <td key={col.key} className="p-2">{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}