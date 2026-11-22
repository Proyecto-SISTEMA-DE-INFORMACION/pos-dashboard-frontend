# Pabst BI — Frontend

Next.js 14 + Tailwind + Recharts. `npm install && npm run dev` → http://localhost:3000

## Conexión con el backend
Los datos vienen del backend FastAPI (`pos-dashboard-backend`). Crea un archivo `.env.local` en esta carpeta:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Con el backend encendido (`uvicorn app.main:app --reload`), inicia sesión con un usuario creado con `python db/crear_usuario.py`.

| Pantalla | Endpoint |
|---|---|
| Login | `POST /auth/login` |
| Carga de Libro | `POST /upload`, `GET /cargas`, `DELETE /cargas/{id}` |
| Resumen y Reportes | `GET /documentos` |
| Facturas | `GET /facturas`, `POST /facturas` |
| Asistente IA | `GET /conversaciones`, `GET /conversaciones/{id}/mensajes`, `DELETE /conversaciones/{id}`, `POST /chat` |

La carga acepta solo el libro de ventas real (hoja LIBROV: FECHA, NRO.BOL, NETO, IVA, TOTAL, FORMA 1…).
La meta mensual del Resumen se guarda solo en el navegador.
