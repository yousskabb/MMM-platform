import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

function DataTable<T>({ columns, data, className = '' }: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-hidden animate-fade-in ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((column, index) => (
                <th 
                  key={index} 
                  className={`py-3 px-4 text-left text-sm font-semibold text-slate-700 ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                {columns.map((column, colIndex) => {
                  const value = typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : row[column.accessor];
                  
                  return (
                    <td 
                      key={colIndex} 
                      className={`py-3 px-4 text-sm text-slate-700 ${column.className || ''}`}
                    >
                      {value as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;