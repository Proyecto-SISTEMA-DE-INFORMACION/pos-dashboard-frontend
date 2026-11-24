"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState} from "react";
import * as XLSX from "xlsx";
import {api} from "./api";
const C=createContext(null);export const useData=()=>useContext(C);
const META_KEY="pabst-bi-meta";
export const MES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const clp=v=>"$"+Math.round(v||0).toLocaleString("es-CL");
export const fd=s=>{const[y,m,d]=s.split("-");return `${d} ${MES[+m-1].toLowerCase()} ${y}`};
export const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
// Plantilla con el formato del libro de ventas real (hoja LIBROV), el único que acepta el backend.
export function downloadTemplate(){const ws=XLSX.utils.aoa_to_sheet([["","","","LIBRO DE VENTAS"],["","","DESDE : 01/01/2026  HASTA: 31/01/2026"],[],["FECHA","NRO.BOL","NETO","IVA","TOTAL","FORMA 1","MONTO 1","FORMA 2","MONTO 2","FORMA 3","MONTO 3"],["01/01/2026","000000001",420.17,79.83,500,"EFECTIVO",500,"",0,"",0],["01/01/2026","000000001",2605.04,494.96,3100,"T. DEBITO",3100,"",0,"",0]]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"LIBROV");XLSX.writeFile(wb,"plantilla_libro_ventas.xlsx")}
export function downloadExcel(name, sheets) {
  const workbook = XLSX.utils.book_new();
  for (const [title, rows] of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = rows[0].map(header => ({ wch: Math.max(15, header.length + 3) }));
    XLSX.utils.book_append_sheet(workbook, sheet, title);
  }
  XLSX.writeFile(workbook, name);
}
export function DataProvider({children}){
 const [s,setS]=useState({docs:[],uploads:[],facturas:[],chats:[],meta:60000000});const [ready,setReady]=useState(false);const [error,setError]=useState("");
 const [user,setUser]=useState(null);
 useEffect(()=>{let active=true;api("/auth/me").then(value=>{if(active)setUser(value)}).catch(()=>{});return ()=>{active=false}},[]);
 const patch=p=>setS(x=>({...x,...p}));
 // Une lo recibido con lo que se agregó mientras cargaba (lo agregado va primero y no se pisa)
 const merge=(local,remote)=>{const ids=new Set(local.map(x=>x.id));return [...local,...remote.filter(x=>!ids.has(x.id))]};
 // Solo se aplica la respuesta de ventas más reciente (una carga inicial lenta no pisa una recarga posterior)
 const seq=useRef(0);
 const loadVentas=useCallback(async()=>{const n=++seq.current;const [docs,uploads]=await Promise.all([api("/documentos"),api("/cargas")]);if(n===seq.current)patch({docs,uploads})},[]);
 useEffect(()=>{let meta=60000000;try{const m=+localStorage.getItem(META_KEY);if(m>0)meta=m}catch{}patch({meta});
  Promise.all([loadVentas(),
   api("/facturas").then(f=>setS(x=>({...x,facturas:merge(x.facturas,f)}))),
   api("/conversaciones").then(c=>setS(x=>({...x,chats:merge(x.chats,c)})))])
   .catch(e=>setError(e.message)).finally(()=>setReady(true))},[loadVentas]);
 // POST /upload: el backend lee el Excel con pandas y omite boletas repetidas
 const importBook=async file=>{const up=await api(`/upload?nombre=${encodeURIComponent(file.name)}`,{method:"POST",body:file,headers:{"Content-Type":"application/octet-stream"}});await loadVentas();return up};
 const removeUpload=async id=>{await api(`/cargas/${id}`,{method:"DELETE"});await loadVentas()};
 const addFactura=async(id_proveedor,monto)=>{const f=await api("/facturas",{method:"POST",json:{id_proveedor,monto}});setS(x=>({...x,facturas:merge([f],x.facturas)}));return f};
 const removeFactura=async id=>{await api(`/facturas/${id}`,{method:"DELETE"});setS(x=>({...x,facturas:x.facturas.filter(f=>f.id!==id)}))};
 const setMeta=meta=>{try{localStorage.setItem(META_KEY,String(meta))}catch{}patch({meta})};
 // Asistente: conversaciones guardadas en PostgreSQL
 const openChat=async id=>{const msgs=await api(`/conversaciones/${id}/mensajes`);setS(x=>({...x,chats:x.chats.map(c=>c.id===id?{...c,msgs}:c)}))};
 const sendChat=async(id,t)=>{const r=await api("/chat",{method:"POST",json:{conversacion_id:id?+id:null,mensaje:t}});const add=[{r:"u",t},{r:"ai",t:r.respuesta}];
  setS(x=>{const cur=x.chats.find(c=>c.id===r.conversacion_id);const otros=x.chats.filter(c=>c.id!==r.conversacion_id);
   return {...x,chats:[{id:r.conversacion_id,title:r.titulo,msgs:[...(cur?.msgs||[]),...add]},...otros]}});return r.conversacion_id};
 const deleteChat=async id=>{await api(`/conversaciones/${id}`,{method:"DELETE"});setS(x=>({...x,chats:x.chats.filter(c=>c.id!==id)}))};
 const refreshFacturas=async()=>{const remote=await api("/facturas");setS(x=>({...x,facturas:merge(remote,x.facturas)}))};
 return <C.Provider value={{...s,ready,error,user,setUser,importBook,removeUpload,addFactura,removeFactura,refreshFacturas,setMeta,openChat,sendChat,deleteChat}}>{children}</C.Provider>}