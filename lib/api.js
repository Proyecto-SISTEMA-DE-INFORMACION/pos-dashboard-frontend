// Cliente del backend FastAPI. La dirección se configura en .env.local (NEXT_PUBLIC_API_URL).
import {getToken,logout} from "./auth";
const BASE=(process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000").replace(/\/$/,"");

export async function api(path,{method="GET",json,body,headers={},download=false}={}){
 const h={...headers};const t=getToken();if(t)h.Authorization="Bearer "+t;
 if(json!==undefined){h["Content-Type"]="application/json";body=JSON.stringify(json)}
 let r;
 try{r=await fetch(BASE+path,{method,headers:h,body})}
 catch{throw new Error("No se pudo conectar con el servidor. Revisa que el backend esté encendido.")}
 if(r.status===401&&path!=="/auth/login"){logout();window.location.href="/login";throw new Error("Tu sesión expiró. Inicia sesión nuevamente.")}
 if(r.ok&&download)return r.blob();
 const data=await r.json().catch(()=>null);
 if(!r.ok){const d=data?.detail;throw new Error(Array.isArray(d)?d.map(x=>x.msg).join(". "):d||`Error del servidor (${r.status})`)}
 return data}
