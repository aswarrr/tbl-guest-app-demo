import { useEffect, useMemo, useState, type ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  minWidth?: number;
};

type Props<T> = {
  rows: T[];
  rowKey: (row: T) => string;
  columns: AdminTableColumn<T>[];
  emptyText?: string;
  onRowClick?: (row: T) => void;
};

export default function AdminDataTable<T>({
  rows,
  rowKey,
  columns,
  emptyText = "No results found.",
  onRowClick,
}: Props<T>) {
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (pageIndex > totalPages - 1) {
      setPageIndex(0);
    }
  }, [pageIndex, totalPages]);

  const pageRows = useMemo(() => {
    const start = pageIndex * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageIndex, pageSize]);

  return (
    <div className="table-shell">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="admin-table-empty" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={onRowClick ? "admin-table-row-clickable" : undefined}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-footer">
        <div className="admin-table-page-size">
          <span>Rows</span>
          <select
            className="input"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-table-pagination">
          <button
            className="admin-table-page-btn"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
          >
            Prev
          </button>

          <span className="admin-table-page-label">
            Page {Math.min(pageIndex + 1, totalPages)} of {totalPages}
          </span>

          <button
            className="admin-table-page-btn"
            disabled={pageIndex >= totalPages - 1}
            onClick={() =>
              setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}