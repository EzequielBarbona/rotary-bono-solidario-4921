# Bono Solidario PolioPlus — Distrito Rotary 4921

Sitio para vender el bono solidario del subcomité PolioPlus: elegir números,
subir el comprobante de la transferencia y confirmar el pago desde un panel
de administración.

- **Sitio en vivo**: https://rotary-bono-solidario-4921.vercel.app
- **Panel de admin**: https://rotary-bono-solidario-4921.vercel.app/admin

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres (Neon) vía Prisma
- Resend para los mails de confirmación
- Desplegado en Vercel, con deploy automático desde este repo

## Correrlo en otra máquina

1. `npm install`
2. Traer las variables de entorno reales desde Vercel:
   ```bash
   vercel link
   vercel env pull .env.local
   ```
3. Copiar `.env.example` a `.env` y completar los valores que no vienen de Vercel
   (título, precio, datos bancarios, etc. — ver comentarios en el archivo).
4. `npx prisma generate`
5. `npm run dev`

## Deploy

Cada push a `master` despliega solo a producción (Vercel está conectado a
este repo). Para desplegar a mano: `vercel --prod`.
