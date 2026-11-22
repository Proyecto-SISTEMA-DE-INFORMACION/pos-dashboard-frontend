"use client";
import Link from "next/link";import {usePathname} from "next/navigation";
import {LayoutGrid,FileBarChart,Upload,FileText,Sparkles,LogOut} from "lucide-react";import {logout,getUser} from "@/lib/auth";import {useEffect,useState} from "react";
const nav=[["/resumen","Resumen",LayoutGrid],["/reportes","Reportes",FileBarChart],["/carga","Carga de Libro",Upload],["/facturas","Facturas",FileText],["/asistente","Asistente IA",Sparkles]];
export default function Sidebar({open,onClose}){const p=usePathname();const [u,setU]=useState(null);useEffect(()=>setU(getUser()),[]);return(
<aside className={`print:hidden fixed md:sticky top-0 z-40 h-screen w-56 shrink-0 bg-navy text-slate-300 flex flex-col p-4 transition-transform ${open?"":"-translate-x-full"} md:translate-x-0`}>
<div className="font-bold text-white text-lg">Pabst BI</div><div className="text-[9px] tracking-widest text-slate-500 mb-4">PABST ANALYTICS</div>
<div className="bg-white/5 rounded-lg p-2 mb-5"><div className="text-xs font-semibold text-white">JOSE PABST SpA</div><div className="text-[10px] text-slate-500">Comercio minorista</div></div>
<div className="text-[9px] text-slate-500 mb-2">PRINCIPAL</div>
<nav className="flex flex-col gap-1 flex-1">{nav.map(([h,l,I])=>
<Link key={h} href={h} onClick={onClose} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${p===h?"bg-brand text-white":"hover:bg-white/5"}`}><I size={14}/>{l}{h==="/asistente"&&<span className="ml-auto bg-brand text-white text-[9px] px-1.5 rounded">IA</span>}</Link>)}</nav>
<div className="flex items-center justify-between border-t border-white/10 pt-3"><div><div className="text-xs text-white">{u?.nombre||"Administración"}</div><div className="text-[10px] text-slate-500">{u?.email||""}</div></div><Link href="/login" onClick={logout} title="Cerrar sesión"><LogOut size={14}/></Link></div>
</aside>)}
