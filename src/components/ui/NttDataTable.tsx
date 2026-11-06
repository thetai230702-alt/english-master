import type { ReactNode } from "react";
import "./NttUI.css";

export type NttDataColumn<T> = {
  key: string;
  title: string;
  render: (row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
};

type NttDataTableProps<T> = {
  columns: NttDataColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  minWidth?: number;
};

export default function NttDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Dữ liệu sẽ hiển thị tại đây khi có bản ghi phù hợp.",
  minWidth = 720,
}: NttDataTableProps<T>) {
  return (
    <div className="ntt-data-table-wrap">
      <table className="ntt-data-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width, textAlign: column.align ?? "left" }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, index) => (
            <tr key={getRowKey(row, index)}>
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? "left" }}>
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length}>
                <div className="ntt-table-empty">
                  <strong>{emptyTitle}</strong>
                  <span>{emptyDescription}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
