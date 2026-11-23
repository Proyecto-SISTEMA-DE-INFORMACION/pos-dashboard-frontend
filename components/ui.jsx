export const Card=({children,className=""})=><div className={`bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto ${className}`}>{children}</div>;
export const Title=({t,s})=><div className="mb-4"><h1 className="text-xl font-bold">{t}</h1><p className="text-xs text-slate-500">{s}</p></div>;
export const Btn=({children,primary,...p})=><button {...p} className={`px-3 py-2 rounded-lg text-xs font-semibold ${primary?"bg-brand text-white":"bg-white border border-slate-200"}`}>{children}</button>;
export const Empty=({t,s,children})=><div className="max-w-xl mx-auto mt-16 bg-white border rounded-xl p-12 text-center"><div className="text-2xl font-extrabold text-navy">{t}</div><p className="text-xs text-slate-400 mt-1">{s}</p>{children}</div>;
