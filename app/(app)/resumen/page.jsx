"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, Pencil } from "lucide-react";
import { useData, clp, downloadExcel } from "@/lib/store";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const number = new Intl.NumberFormat("es-CL");
const money = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const dayLabel = s => `${s.slice(8, 10)} ${months[Number(s.slice(5, 7)) - 1].toLowerCase()}`;
const monthLabel = s => `${months[Number(s.slice(5, 7)) - 1]} ${s.slice(2, 4)}`;
const fullDate = s => s ? `${dayLabel(s)} ${s.slice(0, 4)}` : "—";
const axis = new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 }).format;
const chartMargin = { top: 12, right: 12, left: 0, bottom: 4 };
const chartTick = { fontSize: 11, fill: "#475569" };
const tooltipStyle = { borderRadius: 12, borderColor: "#e2e8f0" };
const previousMonth = s => {
  const [y, m] = s.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

function summarize(docs) {
  const valid = docs.filter(d => String(d.estado || "").trim().toLowerCase() === "vigente" && /^\d{4}-\d{2}-\d{2}$/.test(String(d.fecha || "")));
  const daily = new Map(), monthly = new Map();
  let total = 0, iva = 0;
  for (const doc of valid) {
    const day = doc.fecha, month = day.slice(0, 7);
    const gross = money(doc.total), tax = money(doc.iva), net = money(doc.neto);
    total += gross; iva += tax;
    const d = daily.get(day) || { date: day, total: 0 };
    d.total += gross; daily.set(day, d);
    const m = monthly.get(month) || { date: month, total: 0, neto: 0, iva: 0 };
    m.total += gross; m.neto += net; m.iva += tax; monthly.set(month, m);
  }
  const days = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const periods = [...monthly.values()].sort((a, b) => a.date.localeCompare(b.date));
  const latest = periods.at(-1);
  const prior = latest ? monthly.get(previousMonth(latest.date)) : null;
  return { valid, total, iva, days, periods, latest, variation: prior && prior.total !== 0 ? (latest.total / prior.total - 1) * 100 : null };
}

function Panel({ children, className = "" }) {
  return <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

function Metric({ title, value, description, primary = false }) {
  return <div className={`min-w-0 rounded-2xl border p-4 shadow-sm ${primary ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
    <p className="text-sm font-medium text-slate-600">{title}</p>
    <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{value}</p>
    <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
  </div>;
}

export default function Resumen() {
  const { docs, ready, error, meta, setMeta } = useData();
  const data = useMemo(() => summarize(docs), [docs]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [validation, setValidation] = useState("");
  const progress = meta > 0 ? (data.latest?.total || 0) / meta * 100 : 0;
  const saveGoal = () => {
    const value = Number(draft);
    if (!Number.isSafeInteger(value) || value <= 0) { setValidation("Ingresa un monto entero mayor a cero."); return; }
    setMeta(value); setEditing(false); setValidation("");
  };
  const exportData = () => downloadExcel("resumen-financiero.xlsx", [
    ["Ingresos diarios", [["Fecha", "Ingresos CLP"], ...data.days.map(d => [d.date, d.total])]],
    ["Ventas mensuales", [["Mes", "Neto CLP", "IVA CLP", "Total CLP"], ...data.periods.map(m => [m.date, m.neto, m.iva, m.total])]],
  ]);

  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950 px-5 py-6 text-white sm:px-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Resumen financiero</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
          <CalendarDays size={16} aria-hidden="true" />
          {!ready || error ? "Ventas registradas" : data.days.length
            ? `${fullDate(data.days[0].date)} – ${fullDate(data.days.at(-1).date)}`
            : "Sin período disponible"}
        </p>
      </div>
      <button onClick={exportData} disabled={!ready || !!error || !data.valid.length}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-blue-50 disabled:opacity-50">
        <Download size={16} aria-hidden="true" /> Exportar Excel
      </button>
    </header>

    {!ready ? <Panel><p role="status" className="text-sm text-slate-600">Cargando información financiera…</p></Panel>
      : error ? <Panel><p className="text-sm text-red-700">No fue posible completar la carga de datos.</p></Panel>
      : <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric primary title="Ingresos totales" value={clp(data.total)} description={data.variation === null ? "Sin comparación mensual disponible" : `${number.format(Number(data.variation.toFixed(1)))}% vs. mes anterior`} />
          <Metric title="Ticket promedio" value={clp(data.valid.length ? data.total / data.valid.length : 0)} description="CLP por transacción" />
          <Metric title="Transacciones" value={number.format(data.valid.length)} description="Operaciones vigentes del período" />
          <Metric title="IVA acumulado" value={clp(data.iva)} description="IVA registrado en las ventas" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Panel className="xl:col-span-2">
            <h2 className="font-semibold text-slate-950">Evolución de ingresos</h2>
            <p className="mt-1 text-xs text-slate-600">Ventas diarias en CLP</p>
            {data.days.length ? <div className="mt-4 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.days} margin={chartMargin}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={chartTick} tickLine={false} minTickGap={24} />
                  <YAxis tickFormatter={axis} tick={chartTick} axisLine={false} tickLine={false} width={58} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={fullDate} formatter={value => [clp(value), "Ingresos"]} />
                  <Line type="linear" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={data.days.length === 1} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div> : <p className="grid h-64 place-items-center text-center text-sm text-slate-600">No hay ventas vigentes para graficar.</p>}
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-950">Meta de ingresos</h2>
                <p className="mt-1 text-xs text-slate-600">{data.latest ? `${months[Number(data.latest.date.slice(5)) - 1]} ${data.latest.date.slice(0, 4)}` : "Sin mes registrado"}</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:bg-blue-50"
                onClick={() => { setDraft(String(meta)); setValidation(""); setEditing(true); }}>
                <Pencil size={14} aria-hidden="true" /> Editar
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{clp(data.latest?.total || 0)}</p>
              <p className="mt-1 text-sm text-slate-600">de {clp(meta)}</p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-brand">{number.format(Number(progress.toFixed(1)))}% alcanzado</p>
            </div>

            {editing && <form className="mt-4" onSubmit={event => { event.preventDefault(); saveGoal(); }} noValidate>
              <label className="block text-sm font-medium">
                Meta mensual (CLP)
                <input type="number" min="1" step="1" autoFocus value={draft} onChange={event => setDraft(event.target.value)}
                  aria-invalid={!!validation} aria-describedby={validation ? "meta-error" : undefined}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              {validation && <p id="meta-error" role="alert" className="mt-1 text-xs text-red-700">{validation}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">Guardar</button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Cancelar</button>
              </div>
            </form>}
          </Panel>

          <Panel className="xl:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">Neto e IVA por mes</h2>
                <p className="mt-1 text-xs text-slate-600">Montos mensuales en CLP</p>
              </div>
              {data.periods.length > 0 && <ul aria-label="Leyenda" className="flex gap-4 text-xs text-slate-700">
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-blue-600" />Neto</li>
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-blue-300" />IVA</li>
              </ul>}
            </div>
            {data.periods.length ? <div className="mt-4 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.periods} margin={chartMargin}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={monthLabel} tick={chartTick} tickLine={false} minTickGap={14} />
                  <YAxis tickFormatter={axis} tick={chartTick} axisLine={false} tickLine={false} width={58} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={monthLabel} formatter={(value, name) => [clp(value), name]} />
                  <Bar dataKey="neto" name="Neto" stackId="ventas" fill="#2563eb" maxBarSize={44} isAnimationActive={false} />
                  <Bar dataKey="iva" name="IVA" stackId="ventas" fill="#93c5fd" maxBarSize={44} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div> : <p className="grid h-64 place-items-center text-center text-sm text-slate-600">No hay datos mensuales.</p>}
          </Panel>
        </div>
      </>}
  </div>;
}
