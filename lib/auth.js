// Sesión: token firmado que entrega POST /auth/login, guardado en localStorage.
const K="pabst-session";
const read=()=>{try{return JSON.parse(localStorage.getItem(K)||"null")}catch{return null}};
export const login=(token,usuario)=>{try{localStorage.setItem(K,JSON.stringify({token,usuario}))}catch{}};
export const logout=()=>{try{localStorage.removeItem(K)}catch{}};
export const getToken=()=>read()?.token||null;
export const getUser=()=>read()?.usuario||null;
export const isLogged=()=>!!getToken();
