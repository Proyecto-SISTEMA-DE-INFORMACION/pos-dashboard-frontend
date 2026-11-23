"use client";

import { useState } from "react";
import { Btn, Card } from "@/components/ui";
import { clp } from "@/lib/store";

const formatCount = new Intl.NumberFormat("es-CL").format;

export default function ChartExport({ title, download, note, groups, disabled }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const width = 820;
  const rowHeight = 36;
  const height = 98 + groups.reduce((sum, group) => sum + 50 + group.rows.length * rowHeight, 0);

  async function exportExcel() {
    setBusy(true);
    setError("");
    try {
      await download();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  let top = 88;

  return <Card className="mb-3">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {!disabled && <Btn primary onClick={exportExcel} disabled={busy}>{busy ? "Exportando…" : "Exportar Excel"}</Btn>}
    </div>
    {error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}
    {disabled ? <p className="text-xs text-slate-600">No hay datos disponibles para graficar.</p> :
      <div className="max-h-[34rem] overflow-auto rounded-lg border border-slate-200">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} fontFamily="Arial, sans-serif" className="block w-full min-w-[760px] h-auto">
          <title>{title}</title>
          <rect width={width} height={height} fill="#fff" />
          <text x="24" y="38" fill="#0f172a" fontSize="23" fontWeight="bold">{title}</text>
          <text x="24" y="62" fill="#475569" fontSize="13">{note}</text>
          {groups.map(({ title: groupTitle, rows, unit }) => {
            const start = top;
            top += 50 + rows.length * rowHeight;
            const max = rows.reduce((value, row) => Math.max(value, Math.abs(row.value)), 1);
            const signed = rows.some(row => row.value < 0);
            const origin = signed ? 448 : 276;
            const scale = (signed ? 172 : 344) / max;
            return <g key={groupTitle}>
              <text x="24" y={start + 20} fill="#0f172a" fontSize="16" fontWeight="bold">{groupTitle}</text>
              {rows.map(({ label, value }, index) => {
                const y = start + 36 + index * rowHeight;
                const barWidth = Math.abs(value) * scale;
                return <g key={label}>
                  <title>{label}</title>
                  <text x="24" y={y + 15} fill="#334155" fontSize="13">{label.length > 32 ? label.slice(0, 30) + "…" : label}</text>
                  <rect x="276" y={y} width="344" height="20" rx="4" fill="#eff6ff" />
                  <rect x={value < 0 ? origin - barWidth : origin} y={y} width={barWidth} height="20" rx="4" fill={value < 0 ? "#0f766e" : "#2563eb"} />
                  {signed && <line x1={origin} x2={origin} y1={y} y2={y + 20} stroke="#64748b" />}
                  <text x="795" y={y + 15} textAnchor="end" fill="#0f172a" fontSize="13" fontWeight="bold">{unit === "CLP" ? clp(value) : formatCount(value)}</text>
                </g>;
              })}
            </g>;
          })}
        </svg>
      </div>}
  </Card>;
}
