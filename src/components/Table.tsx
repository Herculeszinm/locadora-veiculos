
import type { ReactNode } from "react";
import { Button } from "./Button";

export interface TableColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  onEdit,
  onDelete,
}: TableProps<T>) {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
            {(onEdit || onDelete) && <th>Ações</th>}
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column, columnIndex) => (
                <td key={columnIndex}>{column.render(item)}</td>
              ))}

              {(onEdit || onDelete) && (
                <td>
                  <div className="d-flex gap-2">
                    {onEdit && (
                      <Button
                        label="Editar"
                        variant="warning"
                        onClick={() => onEdit(item)}
                      />
                    )}

                    {onDelete && (
                      <Button
                        label="Excluir"
                        variant="danger"
                        onClick={() => onDelete(item)}
                      />
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <p className="text-center text-muted">
          Nenhum registro encontrado.
        </p>
      )}
    </div>
  );
}
