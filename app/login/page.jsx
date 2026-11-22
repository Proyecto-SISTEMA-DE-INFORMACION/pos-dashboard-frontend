"use client";
import {useState} from "react";import {useRouter} from "next/navigation";import {Mail,Lock,Eye,EyeOff,ShieldCheck} from "lucide-react";import {login} from "@/lib/auth";import {api} from "@/lib/api";
export default function Login(){const r2=useRouter();const [e,setE]=useState("");const [p,setP]=useState("");const [show,setShow]=useState(false);const [eErr,setEErr]=useState("");const [pErr,setPErr]=useState("");const [busy,setBusy]=useState(false);
const go=async()=>{if(busy)return;
 const okMail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);setEErr(okMail?"":"Ingresa un correo válido");if(!okMail)return;
 if(!p){setPErr("Ingresa tu contraseña");return}
 setBusy(true);try{const r=await api("/auth/login",{method:"POST",json:{email:e,password:p}});login(r.token,r.usuario);r2.push("/resumen")}
 catch(x){setPErr(x.message==="Correo o contraseña incorrectos."?"Contraseña Equivocada Intentar De nuevo":x.message)}finally{setBusy(false)}};
return(<div className="grid md:grid-cols-2 min-h-screen">
<div className="hidden md:flex bg-navy text-white p-8 flex-col justify-between"><div><b>Pabst BI</b><div className="text-[9px] text-slate-500">JOSE PABST SpA</div></div>
<div><img src="/logo-elfaro.svg" alt="El Faro" className="w-56 mx-auto mb-10"/><h2 className="text-3xl font-bold leading-tight">Control financiero<br/>remoto de tus ventas</h2><p className="text-xs text-slate-500 mt-3">La claridad que necesitas para tomar mejores decisiones, estés donde estés.</p></div>
<div className="text-[10px] text-slate-500">© 2026 JOSE PABST SpA. Todos los derechos reservados.</div></div>
<div className="flex items-center justify-center bg-white p-6"><div className="w-full max-w-xs">
<div className="text-[9px] font-bold text-brand">BIENVENIDO A PABST BI</div><h1 className="text-2xl font-extrabold mb-1">Tu negocio, en perspectiva.</h1><p className="text-xs text-slate-400 mb-5">Ingresa tus credenciales para continuar.</p>
<div className="flex justify-between"><label className="text-[10px] font-semibold">Email</label>{eErr&&<span className="text-[10px] text-red-500">{eErr}</span>}</div>
<div className={`flex items-center gap-2 border rounded-lg px-3 py-2 mb-3 ${eErr?"border-red-400":""}`}><Mail size={14} className="text-slate-400"/><input value={e} onChange={x=>{setE(x.target.value);setEErr("")}} onKeyDown={x=>x.key==="Enter"&&go()} placeholder="nombre@empresa.cl" className="text-xs outline-none flex-1 min-w-0"/></div>
<div className="flex justify-between"><label className="text-[10px] font-semibold">Contraseña</label>{pErr&&<span className="text-[10px] text-red-500">{pErr}</span>}</div>
<div className={`flex items-center gap-2 border rounded-lg px-3 py-2 mb-4 ${pErr?"border-red-400":""}`}><Lock size={14} className="text-slate-400"/><input type={show?"text":"password"} value={p} onChange={x=>{setP(x.target.value);setPErr("")}} onKeyDown={x=>x.key==="Enter"&&go()} placeholder="Ingresa tu contraseña" className="text-xs outline-none flex-1 min-w-0"/><button type="button" aria-label="Mostrar contraseña" onClick={()=>setShow(!show)} className="text-slate-400">{show?<EyeOff size={14}/>:<Eye size={14}/>}</button></div>
<button onClick={go} disabled={busy} className="w-full bg-brand text-white text-xs font-semibold py-2.5 rounded-lg disabled:opacity-60">{busy?"Ingresando…":"Iniciar Sesión →"}</button>
<p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1"><ShieldCheck size={12}/>Acceso exclusivo para usuarios autorizados</p></div></div></div>)}
