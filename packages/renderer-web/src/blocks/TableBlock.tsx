import type { TableBlock as TableBlockType } from "@notes/blocks";

export function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <div className="nb-table-wrap">
      <table className="nb-table">
        <thead>
          <tr>
            {block.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
