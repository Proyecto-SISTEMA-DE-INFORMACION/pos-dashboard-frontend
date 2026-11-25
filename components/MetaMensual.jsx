"use client";

// Metas de ingresos por mes. Las metas viven en PostgreSQL (tabla meta_mensual);
// lo vendido se calcula aquí con las ventas vigentes ya cargadas en el navegador.
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { clp } from "@/lib/store";

export const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

const diasDelMes = ym => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
const moverMes = (ym, n) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
export const mesCorto = ym => `${MESES_CORTOS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const mesLargo = ym => `${MESES_LARGOS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const diaCorto = fecha => `${fecha.slice(8, 10)} ${MESES_CORTOS[Number(fecha.slice(5, 7)) - 1].toLowerCase()}`;

// Estado de una meta según hasta qué fecha llegan las ventas cargadas (ultimaVenta)
export function estadoMeta(ym, monto, vendido, ultimaVenta) {
  const fin = `${ym}-${String(diasDelMes(ym)).padStart(2, "0")}`;
  const avance = monto > 0 ? vendido / monto * 100 : 0;
  if (!ultimaVenta || ultimaVenta < `${ym}-01`)
    return { tipo: "sin-ventas", etiqueta: "Sin ventas aún", detalle: "Aún no hay ventas cargadas de este mes.", avance };
  if (ultimaVenta >= fin) {
    const cumplida = vendido >= monto;
    return { tipo: cumplida ? "cumplida" : "no-cumplida", etiqueta: cumplida ? "Cumplida" : "No cumplida",
      detalle: "Mes completo en el libro de ventas.", avance };
  }
  const dias = Number(ultimaVenta.slice(8, 10)), total = diasDelMes(ym);
  return { tipo: "en-curso", etiqueta: `En curso (${dias} de ${total} días)`,
    detalle: `Datos hasta el ${diaCorto(ultimaVenta)} (${dias} de ${total} días).`, avance };
}

const ESTILO = {
  "sin-ventas": "bg-slate-100 text-slate-700",
  "en-curso": "bg-blue-50 text-blue-800",
  cumplida: "bg-emerald-50 text-emerald-800",
  "no-cumplida": "bg-red-50 text-red-800",
};
const Insignia = ({ estado }) =>
  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO[estado.tipo]}`}>
    {estado.tipo === "cumplida" ? "✓ " : estado.tipo === "no-cumplida" ? "✗ " : ""}{estado.etiqueta}
  </span>;

function Panel({ children, className = "", id }) {
  return <section id={id} className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

// Años del selector: desde el primero con datos hasta dos años después del último
function aniosDisponibles(ventasPorMes, metas, mes) {
  const anios = [...ventasPorMes.keys(), ...metas.map(m => m.mes), mes, new Date().toISOString().slice(0, 7)]
    .map(ym => Number(ym.slice(0, 4)));
  const desde = Math.min(...anios), hasta = Math.max(...anios) + 2;
  return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
}

export function TarjetaMeta({ mes, setMes, editando, setEditando, metas, metasReady, metasError, ventasPorMes, ultimaVenta, esAdmin, saveMeta }) {
  const [borrador, setBorrador] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);
  const meta = metas.find(m => m.mes === mes);
  const vendido = ventasPorMes.get(mes) || 0;
  const estado = meta ? estadoMeta(mes, meta.monto, vendido, ultimaVenta) : null;
  const anios = aniosDisponibles(ventasPorMes, metas, mes);
  const cambiarMes = nuevo => { setMes(nuevo); setEditando(false); setAviso(""); };
  // Al abrir la edición (desde aquí o desde el historial) se parte del monto guardado
  useEffect(() => { if (editando) { setBorrador(meta ? String(meta.monto) : ""); setAviso(""); } },
    [editando, mes]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirEdicion = () => setEditando(true);
  const guardar = async event => {
    event.preventDefault();
    const valor = Number(borrador);
    if (!Number.isSafeInteger(valor) || valor <= 0) { setAviso("Ingresa un monto entero mayor a cero."); return; }
    setGuardando(true); setAviso("");
    try { await saveMeta(mes, valor); setEditando(false); }
    catch (falla) { setAviso(falla.message); }
    finally { setGuardando(false); }
  };

  return <Panel id="meta-ingresos">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="font-semibold text-slate-950">Meta de ingresos</h2>
        <p className="mt-1 text-xs text-slate-600">{mesLargo(mes)}</p>
      </div>
      {esAdmin && meta && !editando &&
        <button className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:bg-blue-50" onClick={abrirEdicion}>
          <Pencil size={14} aria-hidden="true" /> Editar
        </button>}
    </div>

    <div className="mt-3 flex items-center gap-1.5">
      <button type="button" aria-label="Mes anterior" onClick={() => cambiarMes(moverMes(mes, -1))}
        className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"><ChevronLeft size={16} aria-hidden="true" /></button>
      <select aria-label="Mes de la meta" value={Number(mes.slice(5, 7))}
        onChange={e => cambiarMes(`${mes.slice(0, 4)}-${String(e.target.value).padStart(2, "0")}`)}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
        {MESES_LARGOS.map((nombre, i) => <option key={nombre} value={i + 1}>{nombre}</option>)}
      </select>
      <select aria-label="Año de la meta" value={Number(mes.slice(0, 4))}
        onChange={e => cambiarMes(`${e.target.value}-${mes.slice(5, 7)}`)}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
        {anios.map(anio => <option key={anio} value={anio}>{anio}</option>)}
      </select>
      <button type="button" aria-label="Mes siguiente" onClick={() => cambiarMes(moverMes(mes, 1))}
        className="rounded-lg border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-50"><ChevronRight size={16} aria-hidden="true" /></button>
    </div>

    {!metasReady ? <p role="status" className="mt-5 text-sm text-slate-600">Cargando metas…</p>
      : metasError && !metas.length ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">No se pudieron cargar las metas: {metasError}</p>
      : meta ? <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="break-words text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{clp(vendido)}</p>
        <p className="mt-1 text-sm text-slate-600">de {clp(meta.monto)}</p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
          <div className={`h-full rounded-full ${estado.tipo === "cumplida" ? "bg-emerald-600" : "bg-brand"}`}
            style={{ width: `${Math.max(0, Math.min(100, estado.avance))}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand">{number.format(estado.avance)}% alcanzado</p>
          <Insignia estado={estado} />
        </div>
        <p className="mt-2 text-xs text-slate-600">{estado.detalle}</p>
      </div>
      : <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-center">
        <p className="text-sm font-semibold text-slate-800">Sin meta para este mes</p>
        {vendido > 0 && <p className="mt-1 text-xs text-slate-600">Vendido: {clp(vendido)}</p>}
        {esAdmin
          ? !editando && <button onClick={abrirEdicion} className="mt-3 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">Definir meta</button>
          : <p className="mt-1 text-xs text-slate-600">Solo un administrador puede definirla.</p>}
      </div>}

    {editando && esAdmin && <form className="mt-4" onSubmit={guardar} noValidate>
      <label className="block text-sm font-medium">
        Meta de {mesLargo(mes)} (CLP)
        <input type="number" min="1" step="1" autoFocus value={borrador} onChange={e => setBorrador(e.target.value)}
          aria-invalid={!!aviso} aria-describedby={aviso ? "meta-error" : undefined}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      {aviso && <p id="meta-error" role="alert" className="mt-1 text-xs text-red-700">{aviso}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={guardando} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar"}</button>
        <button type="button" onClick={() => { setEditando(false); setAviso(""); }} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Cancelar</button>
      </div>
    </form>}
  </Panel>;
}

export function HistorialMetas({ metas, metasReady, ventasPorMes, ultimaVenta, esAdmin, onEditar, removeMeta, className = "" }) {
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const eliminar = async ym => {
    if (ocupado || !window.confirm(`¿Eliminar la meta de ${mesCorto(ym)}?`)) return;
    setOcupado(true); setError("");
    try { await removeMeta(ym); } catch (falla) { setError(falla.message); } finally { setOcupado(false); }
  };

  return <Panel className={className}>
    <h2 className="font-semibold text-slate-950">Historial de metas</h2>
    <p className="mt-1 text-xs text-slate-600">Meta y ventas vigentes (total con IVA) de cada mes con meta registrada</p>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    {!metasReady ? <p role="status" className="mt-4 text-sm text-slate-600">Cargando metas…</p>
      : !metas.length ? <p className="mt-4 text-sm text-slate-600">
        Aún no hay metas registradas.{esAdmin && " Elige un mes en la tarjeta Meta de ingresos y presiona Definir meta."}</p>
      : <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="p-2 font-medium">Mes</th><th className="p-2 text-right font-medium">Meta</th>
              <th className="p-2 text-right font-medium">Vendido</th><th className="p-2 text-right font-medium">Avance</th>
              <th className="p-2 font-medium">Estado</th><th className="p-2 font-medium">Última modificación</th>
              {esAdmin && <th className="p-2 font-medium"><span className="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>{metas.map(m => {
            const vendido = ventasPorMes.get(m.mes) || 0;
            const estado = estadoMeta(m.mes, m.monto, vendido, ultimaVenta);
            return <tr key={m.mes} className="border-t border-slate-100">
              <td className="p-2 font-medium text-slate-900">{mesCorto(m.mes)}</td>
              <td className="p-2 text-right tabular-nums">{clp(m.monto)}</td>
              <td className="p-2 text-right tabular-nums">{estado.tipo === "sin-ventas" ? "—" : clp(vendido)}</td>
              <td className="p-2 text-right tabular-nums">{estado.tipo === "sin-ventas" ? "—" : `${number.format(estado.avance)}%`}</td>
              <td className="p-2"><Insignia estado={estado} /></td>
              <td className="p-2 text-xs text-slate-600">{m.usuario || "Usuario eliminado"} · {m.actualizado.slice(0, 17)}</td>
              {esAdmin && <td className="p-2"><div className="flex justify-end gap-1">
                <button aria-label={`Editar meta de ${mesCorto(m.mes)}`} onClick={() => onEditar(m.mes)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-blue-50">
                  <Pencil size={13} aria-hidden="true" /> Editar</button>
                <button aria-label={`Eliminar meta de ${mesCorto(m.mes)}`} disabled={ocupado} onClick={() => eliminar(m.mes)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 size={13} aria-hidden="true" /> Eliminar</button>
              </div></td>}
            </tr>;
          })}</tbody>
        </table>
      </div>}
  </Panel>;
}
