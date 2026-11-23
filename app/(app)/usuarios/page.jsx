"use client";

import { useEffect, useState } from "react";
import { Btn, Card, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { useData } from "@/lib/store";

const empty = { nombre: "", email: "", tipo_usuario: "LECTOR", password: "" };
const roles = { LECTOR: "Lector", ADMINISTRADOR: "Administrador" };

export default function Usuarios() {
  const { user, setUser } = useData();
  const admin = user?.tipo === "ADMINISTRADOR";
  const [accounts, setAccounts] = useState(null);
  const [ownId, setOwnId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!admin) return;
    let active = true;
    api("/usuarios").then(result => {
      if (active) {
        setAccounts(result.usuarios);
        setOwnId(result.actual);
      }
    }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [admin]);

  function reset() {
    setSelected(null);
    setForm(empty);
  }

  function edit(account) {
    setError("");
    setSelected(account.id_usuario);
    setForm({ nombre: account.nombre, email: account.email, tipo_usuario: account.tipo_usuario, password: "" });
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const { password, ...data } = form;
    data.nombre = data.nombre.trim();
    data.email = data.email.trim();
    if (!data.nombre) {
      setError("Ingresa el nombre del usuario.");
      return;
    }
    if (password) data.password = password;
    setBusy(true);
    setError("");
    try {
      const saved = await api(selected ? `/usuarios/${selected}` : "/usuarios", {
        method: selected ? "PUT" : "POST", json: data,
      });
      setAccounts(current => [...current.filter(account => account.id_usuario !== saved.id_usuario), saved]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-CL")));
      if (saved.id_usuario === ownId) {
        setUser({ nombre: saved.nombre, email: saved.email, tipo: saved.tipo_usuario });
      }
      reset();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(account) {
    if (busy || !window.confirm(`¿Eliminar la cuenta de «${account.nombre}»? Se eliminarán sus conversaciones de IA.`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/usuarios/${account.id_usuario}`, { method: "DELETE" });
      setAccounts(current => current.filter(item => item.id_usuario !== account.id_usuario));
      if (selected === account.id_usuario) reset();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const inputClass = "mt-1 block w-full rounded-lg border px-3 py-2";

  return <div>
    <Title t="Administración de usuarios" s="Crea cuentas y administra sus datos y permisos." />
    {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!user ? <Card>Consultando permisos…</Card>
      : !admin ? <Card>Esta sección requiere permisos de administrador.</Card>
      : !accounts ? <Card>{error ? "No se pudieron cargar los usuarios." : "Cargando usuarios…"}</Card>
      : <>
        <Card className="mb-3">
          <h2 className="mb-3 text-sm font-semibold">{selected ? "Editar usuario" : "Crear usuario"}</h2>
          <form onSubmit={save}>
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <label>Nombre
                <input required maxLength={100} name="nombre" value={form.nombre} onChange={updateField} className={inputClass} />
              </label>
              <label>Correo
                <input required type="email" maxLength={255} name="email" value={form.email} onChange={updateField} className={inputClass} />
              </label>
              <label>Rol
                <select name="tipo_usuario" value={form.tipo_usuario} onChange={updateField}
                  disabled={selected === ownId} className={inputClass}>
                  {Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label>{selected ? "Nueva contraseña (opcional)" : "Contraseña"}
                <input type="password" name="password" autoComplete="new-password" required={!selected} minLength={8} maxLength={200}
                  value={form.password} onChange={updateField} className={inputClass} />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <Btn type="submit" primary disabled={busy}>{selected ? "Guardar cambios" : "Crear usuario"}</Btn>
              {selected && <Btn type="button" onClick={reset} disabled={busy}>Cancelar</Btn>}
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Usuarios registrados</h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr><th className="p-2">Nombre</th><th className="p-2">Correo</th><th className="p-2">Rol</th><th className="p-2">Acciones</th></tr>
            </thead>
            <tbody>{accounts.map(account => <tr key={account.id_usuario} className="border-t">
              <td className="p-2">{account.nombre}{account.id_usuario === ownId && " (tu cuenta)"}</td>
              <td className="p-2">{account.email}</td>
              <td className="p-2">{roles[account.tipo_usuario]}</td>
              <td className="flex gap-2 p-2">
                <Btn disabled={busy} onClick={() => edit(account)}>Editar</Btn>
                {account.id_usuario !== ownId && <Btn disabled={busy} onClick={() => remove(account)}>Eliminar</Btn>}
              </td>
            </tr>)}</tbody>
          </table>
        </Card>
      </>}
  </div>;
}
