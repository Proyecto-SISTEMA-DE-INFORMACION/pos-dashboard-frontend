"use client";

import { useState } from "react";
import { Btn, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { clp } from "@/lib/store";

export default function ProviderAdmin({ providers, loadError, onChange }) {
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setSelected(null);
    setName("");
    setInvoices([]);
  }

  async function edit(provider) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api(`/proveedores/${provider.id_proveedor}`);
      setSelected(data.id_proveedor);
      setName(data.nombre);
      setInvoices(data.facturas.map(invoice => ({ ...invoice, draft: String(invoice.monto) })));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    const nombre = name.trim();
    if (busy || !nombre) return;
    const facturas = invoices.filter(invoice => Number(invoice.draft) !== invoice.monto)
      .map(invoice => ({ id: invoice.id, anterior: invoice.monto, monto: Number(invoice.draft) }));
    if (facturas.some(({ monto }) => !Number.isInteger(monto) || monto < 1 || monto > 2_000_000_000)) {
      setError("Cada monto debe ser un entero entre $1 y $2.000.000.000.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await api(selected ? `/proveedores/${selected}` : "/proveedores", {
        method: selected ? "PUT" : "POST", json: selected ? { nombre, facturas } : { nombre },
      });
      reset();
      await onChange(saved);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(provider) {
    if (busy || !window.confirm(`¿Eliminar al proveedor «${provider.nombre}» del catálogo? Sus facturas seguirán en el historial.`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/proveedores/${provider.id_proveedor}`, { method: "DELETE" });
      if (selected === provider.id_proveedor) reset();
      await onChange(null, provider.id_proveedor);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <Card className="mb-3">
    <h2 className="mb-3 text-sm font-semibold">Administrar proveedores</h2>
    <form onSubmit={save} className="space-y-3">
      <label className="block text-xs font-medium">
        Nombre del proveedor
        <input required maxLength={100} disabled={busy} value={name} onChange={event => setName(event.target.value)}
          className="mt-1 block w-full rounded-lg border px-3 py-2" />
      </label>
      {selected && <div className="rounded-lg border border-slate-200 p-3">
        <h3 className="mb-2 text-sm font-semibold">Facturas del proveedor</h3>
        {invoices.length === 0 ? <p className="text-xs text-slate-600">Este proveedor aún no tiene facturas.</p> :
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr><th className="p-2">Factura</th><th className="p-2">Fecha de registro</th><th className="p-2">Monto registrado</th><th className="p-2">Monto bruto (CLP)</th></tr>
              </thead>
              <tbody>{invoices.map(invoice => <tr key={invoice.id} className="border-t">
                <td className="p-2">#{invoice.id}</td>
                <td className="p-2">{invoice.fecha}</td>
                <td className="p-2">{clp(invoice.monto)}</td>
                <td className="p-2">
                  <input type="number" step="1" required disabled={busy} value={invoice.draft}
                    aria-label={`Monto bruto de la factura #${invoice.id}`}
                    className="w-32 rounded-lg border px-2 py-1"
                    onChange={event => {
                      const draft = event.target.value;
                      setInvoices(current => current.map(row => row.id === invoice.id ? { ...row, draft } : row));
                    }} />
                </td>
              </tr>)}</tbody>
            </table>
          </div>}
      </div>}
      <div className="flex flex-wrap gap-2">
        <Btn type="submit" primary disabled={busy}>{selected ? "Guardar cambios" : "Agregar proveedor"}</Btn>
        {selected && <Btn type="button" onClick={reset} disabled={busy}>Cancelar</Btn>}
      </div>
    </form>
    {(error || loadError) && <p role="alert" className="mt-2 text-xs text-red-700">{error || loadError}</p>}
    {providers === null ? <p className="mt-3 text-xs text-slate-600">{loadError ? "Catálogo no disponible." : "Cargando proveedores…"}</p>
      : providers.length === 0 ? <p className="mt-3 text-xs text-slate-600">No hay proveedores registrados.</p>
      : <ul className="mt-3 divide-y divide-slate-100">
        {providers.map(provider => <li key={provider.id_proveedor} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <span className="break-all">{provider.nombre}</span>
          <div className="flex gap-2">
            <Btn disabled={busy} aria-label={`Editar ${provider.nombre}`} onClick={() => edit(provider)}>Editar</Btn>
            <Btn disabled={busy} aria-label={`Eliminar ${provider.nombre}`} onClick={() => remove(provider)}>Eliminar</Btn>
          </div>
        </li>)}
      </ul>}
  </Card>;
}
