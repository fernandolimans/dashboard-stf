function renderCell(row, column) {
  if (column.render) {
    return column.render(row);
  }

  return row[column.key];
}

export function DataTable({
  rows,
  columns,
  emptyMessage = "Nenhum registro encontrado para os filtros atuais.",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-white">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`${row.id || row.processo || row.title || "row"}-${index}`}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="border-t border-slate-100 px-4 py-3 align-top text-slate-700"
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
