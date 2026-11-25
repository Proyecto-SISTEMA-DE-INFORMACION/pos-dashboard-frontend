"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { login } from "@/lib/auth";
import { api } from "@/lib/api";

export default function Login() {
  const r2 = useRouter();
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [eErr, setEErr] = useState("");
  const [pErr, setPErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (ev) => {
    ev?.preventDefault();
    if (busy) return;

    const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    setEErr(okMail ? "" : "Ingresa un correo válido");
    if (!okMail) return;

    if (!p) {
      setPErr("Ingresa tu contraseña");
      return;
    }

    setBusy(true);
    try {
      const r = await api("/auth/login", {
        method: "POST",
        json: { email: e, password: p },
      });
      login(r.token, r.usuario);
      r2.push("/resumen");
    } catch (x) {
      setPErr(
        x.message === "Correo o contraseña incorrectos."
          ? "Contraseña Equivocada Intentar De nuevo"
          : x.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 min-h-screen bg-white">
      {/* Panel izquierdo: visible desde 1024px (lg) */}
      <div className="hidden lg:flex relative overflow-hidden bg-navy text-white p-12 xl:p-16 flex-col justify-between">
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/15 blur-3xl" />

        <div className="relative z-10">
          <div className="text-lg font-bold tracking-tight">Pabst BI</div>
          <div className="text-xs text-slate-400 tracking-wider mt-0.5">
            JOSE PABST SpA
          </div>
        </div>

        <div className="relative z-10 max-w-lg mx-auto w-full my-auto py-8">
          <img
            src="/logo-elfaro.svg"
            alt="El Faro"
            className="w-56 xl:w-64 mx-auto mb-12"
          />
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
            Control financiero
            <br />
            remoto de tus ventas
          </h2>
          <p className="text-sm xl:text-base text-slate-300 mt-4 leading-relaxed">
            La claridad que necesitas para tomar mejores decisiones, estés donde estés.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © 2026 JOSE PABST SpA. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          {/* Marca visible solo en móvil/tablet */}
          <div className="lg:hidden mb-8 pb-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-slate-900">Pabst BI</div>
              <div className="text-xs text-slate-400">JOSE PABST SpA</div>
            </div>
            <img src="/logo-elfaro.svg" alt="El Faro" className="h-8 w-auto" />
          </div>

          <div className="text-xs font-bold tracking-widest uppercase text-brand mb-2">
            Bienvenido a Pabst BI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Tu negocio, en perspectiva.
          </h1>
          <p className="text-sm text-slate-500 mb-8">
            Ingresa tus credenciales para continuar.
          </p>

          <form onSubmit={go} className="space-y-5" noValidate>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                {eErr && <span className="text-xs font-medium text-red-500">{eErr}</span>}
              </div>
              <div
                className={`flex items-center gap-3 border rounded-xl px-3.5 py-3 bg-slate-50/50 transition-all focus-within:bg-white focus-within:ring-2 ${
                  eErr
                    ? "border-red-400 focus-within:ring-red-200"
                    : "border-slate-200 focus-within:border-brand focus-within:ring-brand/20"
                }`}
              >
                <Mail size={18} className="text-slate-400 shrink-0" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={e}
                  onChange={(x) => {
                    setE(x.target.value);
                    setEErr("");
                  }}
                  placeholder="nombre@empresa.cl"
                  className="text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none flex-1 min-w-0"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Contraseña
                </label>
                {pErr && <span className="text-xs font-medium text-red-500">{pErr}</span>}
              </div>
              <div
                className={`flex items-center gap-3 border rounded-xl px-3.5 py-3 bg-slate-50/50 transition-all focus-within:bg-white focus-within:ring-2 ${
                  pErr
                    ? "border-red-400 focus-within:ring-red-200"
                    : "border-slate-200 focus-within:border-brand focus-within:ring-brand/20"
                }`}
              >
                <Lock size={18} className="text-slate-400 shrink-0" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={p}
                  onChange={(x) => {
                    setP(x.target.value);
                    setPErr("");
                  }}
                  placeholder="Ingresa tu contraseña"
                  className="text-base sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none flex-1 min-w-0"
                />
                <button
                  type="button"
                  aria-label="Mostrar contraseña"
                  onClick={() => setShow(!show)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-brand hover:opacity-95 active:scale-[0.99] text-white text-sm sm:text-base font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {busy ? (
                "Ingresando…"
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck size={15} className="shrink-0" />
            Acceso exclusivo para usuarios autorizados
          </p>
        </div>
      </div>
    </div>
  );
}