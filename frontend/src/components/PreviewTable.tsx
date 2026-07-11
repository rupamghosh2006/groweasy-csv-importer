'use client';

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {rows.length} row{rows.length !== 1 ? 's' : ''} parsed
      </p>
      <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-h-[500px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#294744] text-white">
              <th className="sticky top-0 bg-[#294744] px-4 py-3 text-left font-medium whitespace-nowrap">#</th>
              {headers.map((h) => (
                <th key={h} className="sticky top-0 bg-[#294744] px-4 py-3 text-left font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{idx + 1}</td>
                {headers.map((h) => (
                  <td key={h} className="px-4 py-2.5 whitespace-nowrap max-w-[250px] overflow-hidden text-ellipsis">
                    {row[h] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 100 && (
          <div className="p-4 text-center text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800">
            Showing first 100 of {rows.length} rows
          </div>
        )}
      </div>
    </div>
  );
}
