"use client";
import {useState} from "react";import {Send,Sparkles} from "lucide-react";import {useData} from "@/lib/store";
// Las respuestas vienen de POST /chat (FastAPI → Gemini) con el resumen financiero de la base como contexto.
const sug=["Resumen del mes","¿Cuánto IVA debo pagar?","Mejor día de la semana","Ticket promedio","Gastos con proveedores"];
export default function Asistente(){const data=useData();const chats=data.chats||[];const [id,setId]=useState(null);const [q,setQ]=useState("");const [busy,setBusy]=useState(false);const [pend,setPend]=useState(null);const [err,setErr]=useState("");
const cur=chats.find(c=>c.id===id),msgs=[...(cur?.msgs||[]),...(pend?[{r:"u",t:pend},{r:"ai",t:"Analizando tus datos…"}]:[])];
const open=async cid=>{setId(cid);setErr("");const c=chats.find(x=>x.id===cid);if(!c?.msgs)try{await data.openChat(cid)}catch(e){setErr(e.message)}};
const send=async t=>{t=(t??q).trim();if(!t||busy)return;setBusy(true);setPend(t);setQ("");setErr("");
 try{const nid=await data.sendChat(id,t);setId(nid)}catch(e){setErr(e.message);setQ(t)}finally{setPend(null);setBusy(false)}};
const del=async cid=>{try{await data.deleteChat(cid);if(cid===id)setId(null)}catch(e){setErr(e.message)}};
return(<div className="flex bg-white border rounded-xl overflow-hidden h-[80vh]">
<div className="hidden md:block w-60 border-r p-4 overflow-auto"><div className="font-bold text-sm mb-3">Conversaciones</div><button onClick={()=>{setId(null);setErr("")}} className="w-full bg-brand text-white text-xs font-semibold py-2 rounded-lg mb-3">+ Nueva conversación</button>
{!chats.length&&<p className="text-[10px] text-slate-400">Tus conversaciones aparecerán aquí.</p>}
{chats.map(c=><div key={c.id} className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer ${c.id===id?"bg-blue-50":"hover:bg-slate-50"}`} onClick={()=>open(c.id)}><span className="truncate">{c.title}</span><button title="Eliminar" onClick={e=>{e.stopPropagation();del(c.id)}} className="text-slate-400 ml-2">×</button></div>)}</div>
<div className="flex-1 min-w-0 flex flex-col"><div className="p-4 border-b flex items-center gap-2 text-sm font-bold"><Sparkles size={16} className="text-brand"/>Asistente financiero<span className="ml-auto text-[10px] font-normal border rounded-full px-2">Powered by Gemini</span></div>
<div className="flex-1 overflow-auto p-4 space-y-3">{!msgs.length&&<p className="text-xs text-slate-400">Pregunta por ventas, IVA, gastos, ticket promedio o tu mejor día.</p>}{msgs.map((m,i)=><div key={i} className={`max-w-md text-xs p-3 rounded-xl whitespace-pre-line ${m.r==="u"?"ml-auto bg-blue-50":"border"}`}>{m.t}</div>)}{err&&<p className="text-xs text-red-500">{err}</p>}</div>
<div className="px-3 pt-2 flex gap-2 overflow-x-auto">{sug.map(x=><button key={x} disabled={busy} onClick={()=>send(x)} className="shrink-0 text-[10px] border rounded-full px-3 py-1 hover:bg-slate-50 disabled:opacity-50">{x}</button>)}</div>
<div className="p-3 flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pregúntame sobre las finanzas de tu negocio..." className="flex-1 min-w-0 border rounded-lg px-3 text-xs"/><button onClick={()=>send()} disabled={busy} aria-label="Enviar" className="bg-brand text-white p-2 rounded-lg disabled:opacity-60"><Send size={14}/></button></div>
<p className="text-[9px] text-slate-400 text-center pb-2">Gemini puede cometer errores. Verifica la información financiera importante.</p></div></div>)}
