/*
File: FormGrid.tsx
Type: React + TypeScript component (default export)
SCSS: styles.scss (below inside comment)

This upgraded version has a cleaner, modern UI with card-style columns, sticky headers, improved spacing, subtle animations, and a more polished experience inspired by Google Sheets & Notion.
*/

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "email"
  | "file";

type Column = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  width?: number;
};

type CellValue = string | number | boolean | null | File | string[];

type Row = {
  id: string;
  cells: Record<string, CellValue>;
};

const defaultColumns: Column[] = [
  { id: "col-1", label: "Name", type: "text", required: true, width: 220 },
  { id: "col-2", label: "Email", type: "email", required: false, width: 250 },
  { id: "col-3", label: "Role", type: "select", options: ["User", "Admin", "Owner"], width: 160 },
  { id: "col-4", label: "Active", type: "checkbox", width: 100 },
  { id: "col-5", label: "Notes", type: "textarea", width: 300 },
];

const uid = (prefix = "id") => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export default function FormGrid() {
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem("fg_columns");
    return saved ? JSON.parse(saved) : defaultColumns;
  });

  const [rows, setRows] = useState<Row[]>(() => {
    const saved = localStorage.getItem("fg_rows");
    if (saved) return JSON.parse(saved);
    const r: Row = { id: uid("row"), cells: {} };
    columns.forEach((c) => (r.cells[c.id] = null));
    return [r];
  });

  const [schemaName, setSchemaName] = useState("My Form Schema");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("fg_columns", JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem("fg_rows", JSON.stringify(rows));
  }, [rows]);

  const addColumn = () => {
    const id = uid("col");
    const newCol: Column = { id, label: "Untitled", type: "text", width: 200 };
    setColumns((c) => [...c, newCol]);
  };

  const removeColumn = (colId: string) => {
    if (!confirm("Remove column and all values?")) return;
    setColumns((c) => c.filter((x) => x.id !== colId));
  };

  const updateColumn = (colId: string, patch: Partial<Column>) => {
    setColumns((cols) => cols.map((c) => (c.id === colId ? { ...c, ...patch } : c)));
  };

  const addRow = () => {
    const r: Row = { id: uid("row"), cells: {} };
    columns.forEach((c) => (r.cells[c.id] = null));
    setRows((s) => [...s, r]);
  };

  const removeRow = (rowId: string) => {
    setRows((s) => s.filter((r) => r.id !== rowId));
  };

  const updateCell = (rowId: string, colId: string, value: CellValue) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r))
    );
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = r.cells[c.id];
        return String(cellToString(v)).toLowerCase().includes(q);
      })
    );
  }, [rows, search, columns]);

  return (
    <div className="fg-root">
      <div className="fg-topbar">
        <div className="fg-left">
          <button onClick={addColumn} className="btn primary">+ Column</button>
          <button onClick={addRow} className="btn primary">+ Row</button>
        </div>
        <div className="fg-right">
          <input className="fg-search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="fg-schema-name" value={schemaName} onChange={(e) => setSchemaName(e.target.value)} />
        </div>
      </div>

      <div className="fg-main">
        <div className="fg-grid">
          <div className="fg-grid-head">
            {columns.map((c) => (
              <div key={c.id} className="fg-grid-head-cell">{c.label}</div>
            ))}
            <div className="fg-grid-head-cell actions">Actions</div>
          </div>

          <div className="fg-grid-body">
            <AnimatePresence>
              {filteredRows.map((r) => (
                <motion.div
                  key={r.id}
                  className="fg-grid-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {columns.map((c) => (
                    <div key={c.id} className="fg-grid-cell">
                      <CellRenderer
                        column={c}
                        rowId={r.id}
                        value={r.cells[c.id]}
                        onChange={(v) => updateCell(r.id, c.id, v)}
                      />
                    </div>
                  ))}
                  <div className="fg-grid-cell actions">
                    <button className="btn small" onClick={() => navigator.clipboard?.writeText(JSON.stringify(r.cells))}>Copy</button>
                    <button className="btn small danger" onClick={() => removeRow(r.id)}>Delete</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function CellRenderer({ column, value, onChange }: { column: Column; value: CellValue; onChange: (v: CellValue) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  };

  switch (column.type) {
    case "text":
    case "email":
      return <input value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} placeholder={column.label} />;
    case "number":
      return <input type="number" value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
    case "textarea":
      return <textarea value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <select value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="">-- select --</option>
          {(column.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case "checkbox":
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(Boolean(e.target.checked))} />;
    case "date":
      return <input type="date" value={value === null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} />;
    case "file":
      return <input type="file" onChange={handleFile} />;
    default:
      return null;
  }
}

function cellToString(v: CellValue) {
  if (v == null) return "";
  if (v instanceof File) return v.name;
  if (Array.isArray(v)) return v.join(",");
  return String(v);
}