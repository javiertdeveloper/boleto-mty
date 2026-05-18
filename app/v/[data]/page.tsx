/**
 * /v/[data] — Server Component que decodifica el payload del QR y valida
 * expiración antes de renderizar nada.
 *
 * Por qué Server Component (sin 'use client'):
 *   - Next.js 16 + React 19: el decode + validation viven en el server,
 *     el client recibe HTML estático listo. Cero hydration mismatch, cero
 *     `useState(initializer)` con side-effect.
 *   - Si el payload del QR está corrupto / mal encoded, el server retorna
 *     <ErrorView /> en HTML directamente — el browser del cliente NO ve
 *     un crash 500 (que Chrome móvil reporta como "This page couldn't load").
 *   - Más rápido para el celular del cliente: no necesita ejecutar JS para
 *     ver el boleto, solo descargar HTML pre-renderizado.
 *
 * El JSX del boleto + handleDownload (jsPDF) viven en BoletoCard.tsx,
 * que es Client Component porque jsPDF y el state del logo fallback
 * necesitan browser.
 */

import { BoletoCard, type BoletoData } from './BoletoCard'

const BOLETO_EXPIRY_HOURS = 2

/**
 * Decoder ROBUST del base64url/base64 que viene en el path.
 *
 * Acepta:
 *   - base64url (RFC 4648 §5) sin padding — kiosko nuevo manda esto.
 *   - base64 estándar con `+`, `/`, `=` — backward-compat con QRs viejos.
 *
 * Si CUALQUIER paso falla (encoding raro, JSON corrupto, shape inválido),
 * retorna null para que el caller renderice ErrorView. Nunca tira.
 */
function decodeBoleto(encoded: string): BoletoData | null {
  try {
    // base64url → base64 estándar. Si el input ya era estándar, los
    // replace son no-op (no había `-` ni `_`).
    const standard = encoded.replace(/-/g, '+').replace(/_/g, '/')
    // Restaurar padding si falta (base64url lo quita; atob lo requiere).
    const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4)
    // atob → string URL-encoded → decodeURIComponent → JSON.
    const json = decodeURIComponent(atob(padded))
    const data = JSON.parse(json)
    if (!data || typeof data !== 'object') return null
    if (!data.c || !data.e) return null
    return data as BoletoData
  } catch {
    return null
  }
}

function isExpired(boleto: BoletoData): boolean {
  if (!boleto.x) return false
  const elapsed = Date.now() - boleto.x
  return elapsed > BOLETO_EXPIRY_HOURS * 60 * 60 * 1000
}

/* ─── Error / expired states (server-rendered) ──────────────────────── */

function ExpiredView() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'rgba(245, 158, 11, 0.1)' }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <p className="mt-5 text-center text-xl font-semibold text-gray-800">Boleto expirado</p>
      <p className="mt-2 max-w-[260px] text-center text-sm text-gray-400">
        Este boleto ya no es valido. Los boletos expiran {BOLETO_EXPIRY_HOURS} horas despues de su
        emision.
      </p>
    </div>
  )
}

function ErrorView() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <p className="mt-5 text-center text-xl font-semibold text-gray-800">Boleto no valido</p>
      <p className="mt-2 max-w-[260px] text-center text-sm text-gray-400">
        El codigo escaneado no es valido o esta danado
      </p>
    </div>
  )
}

/* ─── Server Component entry ────────────────────────────────────────── */

export default async function BoletoPage({
  params
}: {
  params: Promise<{ data: string }>
}) {
  const { data: encoded } = await params

  const boleto = decodeBoleto(encoded)
  if (!boleto) return <ErrorView />

  if (isExpired(boleto)) return <ExpiredView />

  return <BoletoCard boleto={boleto} />
}
