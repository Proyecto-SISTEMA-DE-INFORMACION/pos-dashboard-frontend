"use client";
import {useEffect,useState} from "react";import {useRouter} from "next/navigation";import {Menu} from "lucide-react";
import Sidebar from "./Sidebar";import {isLogged} from "@/lib/auth";import {DataProvider,useData} from "@/lib/store";
const Aviso=()=>{const {error}=useData();return error?<div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 mb-3">{error}</div>:null};
export default function Shell({children}){const r=useRouter();const [ok,setOk]=useState(false);const [open,setOpen]=useState(false);
useEffect(()=>{isLogged()?setOk(true):r.replace("/login")},[r]);
if(!ok)return null;
return <DataProvider><div className="flex">{open&&<div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={()=>setOpen(false)}/>}
<Sidebar open={open} onClose={()=>setOpen(false)}/>
<main className="flex-1 min-w-0 p-4 md:p-6 max-w-6xl"><button aria-label="Abrir menú" className="md:hidden mb-3 p-2 border rounded-lg bg-white print:hidden" onClick={()=>setOpen(true)}><Menu size={16}/></button><Aviso/>{children}</main></div></DataProvider>}
