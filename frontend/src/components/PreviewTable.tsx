'use client';

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

const previewLimit = 100;

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="ge-preview-table-wrap">
      <div className="ge-table-frame">
        <table className="ge-data-table">
          <thead>
            <tr>
              <th>#</th>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, previewLimit).map((row, rowIndex) => (
              <tr key={`${rowIndex}-${headers[0] ?? 'row'}`}>
                <td>{rowIndex + 1}</td>
                {headers.map((header) => (
                  <td key={header} title={String(row[header] ?? '')}>
                    {row[header] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > previewLimit && (
        <p className="ge-table-footnote">Showing first {previewLimit} of {rows.length} rows</p>
      )}
    </div>
  );
}
