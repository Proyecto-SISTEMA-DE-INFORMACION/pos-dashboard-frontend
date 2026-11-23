"use client";

import { useEffect, useMemo, useState } from "react";
import ChartExport from "@/components/ChartExport";
import ProviderAdmin from "@/components/ProviderAdmin";
import { Card, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { clp, useData } from "@/lib/store";

const credito = monto => monto * 19 / 119;

function summarize(facturas, docs) {
  const proveedores = new Map();
  let compras = 0;
  for (const { prov, monto } of facturas) {
    const row = proveedores.get(prov) ?? { label: prov, count: 0, amount: 0 };
    row.count += 1;
    row.amount += Number(monto);
    compras += Number(monto);
    proveedores.set(prov, row);
  }

  const rows = [...proveedores.values()].sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label, "es-CL"));
  const debito = docs.reduce((sum, doc) =>
    String(doc.estado).trim().toLowerCase() === "vigente" ? sum + (Number(doc.iva) || 0) : sum, 0);
  const credit = credito(compras);

  return {
    debito, credit, saldo: debito - credit,
    groups: [
      { title: "IVA de ventas y compras registradas (CLP)", unit: "CLP", rows: [
        { label: "IVA débito · ventas vigentes", value: debito },
        { label: "IVA crédito · compras", value: credit },
        { label: "Saldo · débito menos crédito", value: debito - credit },
      ] },
      { title: "Facturas por proveedor", rows: rows.map(row => ({ label: row.label, value: row.count })) },
      { title: "Compras brutas por proveedor (CLP)", unit: "CLP", rows: rows.map(row => ({ label: row.label, value: row.amount })) },
      { title: "IVA crédito por proveedor (CLP)", unit: "CLP", rows: rows.map(row => ({ label: row.label, value: credito(row.amount) })) },
    ].filter(group => group.rows.length),
  };
}

export default function Facturas() {
  const { facturas, docs, ready, error, user, addFactura, refreshFacturas } = useData();
  const { debito, credit, saldo, groups } = useMemo(() => summarize(facturas, docs), [facturas, docs]);
  const [providerId, setProviderId] = useState("");
  const [monto, setMonto] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState(null);
  const [providerError, setProviderError] = useState("");
  const isAdmin = user?.tipo === "ADMINISTRADOR";
  const selectedProvider = providers?.find(provider => String(provider.id_proveedor) === providerId);

  useEffect(() => {
    let active = true;
    api("/proveedores").then(value => { if (active) setProviders(value); })
      .catch(failure => { if (active) setProviderError(failure.message); });
    return () => { active = false; };
  }, []);

  async function add(event) {
    event.preventDefault();
    if (busy) return;
    if (!selectedProvider) {
      setErr("Selecciona un proveedor del catálogo.");
      return;
    }
    const bruto = Number(monto);
    if (!Number.isInteger(bruto) || bruto < 1 || bruto > 2_000_000_000) {
      setErr("Ingresa un monto bruto entero entre $1 y $2.000.000.000.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await addFactura(selectedProvider.id_proveedor, bruto);
      setProviderId("");
      setMonto("");
    } catch (failure) {
      setErr(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeProvider(saved, removed) {
    if (removed) setProviderId(current => current === String(removed) ? "" : current);
    setProviders(current => {
      const id = saved?.id_proveedor ?? removed;
      const next = (current ?? []).filter(provider => provider.id_proveedor !== id);
      return (saved ? [...next, saved] : next).sort((a, b) => a.nombre.localeCompare(b.nombre, "es-CL"));
    });
    if (saved) {
      try {
        await refreshFacturas();
      } catch (failure) {
        throw new Error(`Proveedor guardado. No se pudo actualizar el historial: ${failure.message}`);
      }
    }
  }

  async function exportExcel() {
    const blob = await api("/facturas/exportacion", { download: true });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "compras-proveedores-iva.xlsx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div>
    <Title t="Facturas de proveedores" s="Registra compras y compara el IVA de ventas y compras." />
    {isAdmin && <Card className="mb-3">
      <h2 className="mb-2 text-sm font-semibold">Registrar factura</h2>
      <form onSubmit={add} noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-medium">
            Proveedor
            <select value={selectedProvider ? providerId : ""} onChange={event => setProviderId(event.target.value)}
              disabled={busy || !providers?.length} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 disabled:bg-slate-100">
              <option value="" disabled>{providers ? "Selecciona un proveedor" : providerError ? "Catálogo no disponible" : "Cargando proveedores…"}</option>
              {providers?.map(provider => <option key={provider.id_proveedor} value={provider.id_proveedor}>{provider.nombre}</option>)}
            </select>
          </label>
          <label className="flex-1 text-xs font-medium">
            Monto bruto con IVA (CLP)
            <input value={monto} onChange={event => setMonto(event.target.value)} type="number" min="1" max="2000000000" step="1"
              placeholder="$ 0" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
          <button type="submit" disabled={busy || !selectedProvider}
            className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {busy ? "Registrando…" : "Registrar factura"}
          </button>
        </div>
        {providers?.length === 0 && <p className="mt-2 text-xs text-slate-600">Agrega un proveedor en Administrar proveedores para registrar la primera factura.</p>}
        {err && <p role="alert" className="mt-2 text-xs text-red-700">{err}</p>}
      </form>
    </Card>}

    {isAdmin && <ProviderAdmin providers={providers} loadError={providerError} onChange={changeProvider} />}

    <Card className="mb-3">
      <h2 className="mb-2 text-sm font-semibold">Comparación de IVA</h2>
      {!ready ? <p role="status" className="text-xs">Cargando ventas y compras…</p> :
        error ? <p className="text-xs">No fue posible obtener todos los datos para calcular el saldo.</p> :
        <>
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              ["IVA débito · ventas", debito],
              ["IVA crédito estimado · compras", credit],
              ["Saldo estimado · débito menos crédito", saldo],
            ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs text-slate-600">{label}</dt>
              <dd className="mt-1 text-lg font-bold">{clp(value)}</dd>
            </div>)}
          </dl>
          <p className="mt-2 text-xs text-slate-600">Totales de todos los registros disponibles. El crédito se estima aplicando 19/119 al monto bruto de las facturas.</p>
        </>}
    </Card>

    <ChartExport title="Compras por proveedor e IVA" download={exportExcel}
      note="Histórico registrado · IVA crédito y saldo estimados al 19 %"
      groups={groups} disabled={!ready || !!error || (!facturas.length && !docs.some(doc => String(doc.estado).trim().toLowerCase() === "vigente"))} />

    <Card>
      <h2 className="mb-2 text-sm font-semibold">Historial de facturas</h2>
      {!facturas.length ? <p className="py-8 text-center text-sm text-slate-600">{ready ? "No hay facturas disponibles." : "Cargando facturas…"}</p> :
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-2">Proveedor</th><th className="p-2">Fecha de registro</th><th className="p-2 text-right">Monto bruto</th><th className="p-2 text-right">IVA crédito estimado</th></tr>
          </thead>
          <tbody>{facturas.map(row => <tr key={row.id} className="border-t">
            <td className="p-2">{row.prov}</td><td className="p-2 text-slate-600">{row.fecha}</td>
            <td className="p-2 text-right font-semibold">{clp(row.monto)}</td><td className="p-2 text-right">{clp(credito(row.monto))}</td>
          </tr>)}</tbody>
        </table>}
    </Card>
  </div>;
}
