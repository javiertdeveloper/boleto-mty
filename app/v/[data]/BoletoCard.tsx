'use client'

/**
 * Client Component aislado para el render del boleto + descarga de PDF.
 *
 * Por qué un Client Component aparte:
 *   - jsPDF necesita browser (es un módulo client-only).
 *   - El `<img>` con onError (fallback del logo cuando no existe) también
 *     necesita state cliente para esconder la imagen rota.
 *   - El page.tsx padre se queda como Server Component (decode + validation
 *     ocurre server-side) y le pasa el `boleto` ya validado como prop.
 *
 * Beneficio: cero hydration mismatch, cero `useState(() => setState(...))`
 * anti-idiomatic. Si el decode falla, el padre nunca renderiza este
 * componente — el cliente solo ve datos que ya pasaron validation server-side.
 */

import { useState } from 'react'

export interface BoletoData {
  c: string // controlNumber
  e: string // empresa
  d: string // destino
  a: string // address / zone code
  t: number // total
  v: string // vehicleType
  p: number // pasajeros
  q: number // equipaje
  f: string // fecha
  x?: number // timestamp (ms) for expiration
}

const LOGO_KEYWORDS: [string, string][] = [
  ['suburban', 'SUBURBAN'],
  ['timovil', 'TIMOVIL'],
  ['golden', 'GOLDEN'],
  ['ecofy', 'ECOFY'],
  ['ejecutivo', 'EJECUTIVO'],
  ['contaxi', 'CONTAXI'],
  ['totsa plus', 'TPLUS'],
  ['tplus', 'TPLUS'],
  ['totsa', 'TOTSA'],
  ['tpa', 'TPA'],
  ['mundo verde', 'MUNDOVERDE'],
  ['privauto', 'PRIVAUTO']
]

function getLogoFile(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [kw, file] of LOGO_KEYWORDS) {
    if (lower.includes(kw)) return file
  }
  return null
}

function CompanyLogo({ name }: { name: string }) {
  const [show, setShow] = useState(true)
  const file = getLogoFile(name)
  if (!file || !show) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${file}.jpg`}
      alt={name}
      onError={() => setShow(false)}
      className="mt-1 rounded object-contain"
      style={{ height: 40, width: 'auto', maxWidth: '100%' }}
    />
  )
}

/**
 * Resuelve el nombre del vehículo a algo legible. El kiosko manda el
 * `nombre` del servicio ("SEDAN" / "CAMIONETA" / "EJECUTIVO") por default,
 * pero algunos QRs legacy pueden tener un UUID o `'suv'/'sedan'`. Toleramos
 * las tres formas. Cualquier string > 30 chars asumimos que es un UUID
 * (los nombres reales no llegan a ese largo) y caemos a "Vehículo" genérico.
 */
function resolveVehicleLabel(v: string | undefined): string {
  const raw = (v ?? '').toString().trim()
  if (!raw) return 'Vehículo'
  if (raw.length > 30) return 'Vehículo'
  const lower = raw.toLowerCase()
  if (lower === 'suv' || lower.includes('camion')) return 'Camioneta'
  if (lower === 'sedan' || lower.includes('sedán')) return 'Sedan'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

export function BoletoCard({ boleto }: { boleto: BoletoData }) {
  const vehicleLabel = resolveVehicleLabel(boleto.v)

  const handleDownload = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('AEROPUERTO INTERNACIONAL', 40, 10, { align: 'center' })
    doc.text('DE MONTERREY', 40, 15, { align: 'center' })
    doc.setDrawColor(200)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(5, 24, 75, 24)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('TICKET DE ABORDAJE', 40, 30, { align: 'center' })
    doc.setFontSize(7)
    doc.text(boleto.c, 40, 35, { align: 'center' })

    doc.line(5, 39, 75, 39)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('COMPANIA', 5, 45)
    doc.setFont('helvetica', 'bold')
    doc.text(boleto.e, 5, 50)

    doc.setFont('helvetica', 'normal')
    doc.text('TOTAL', 55, 45)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(16, 185, 129)
    doc.text(`$${boleto.t}.00 MXN`, 55, 50)
    doc.setTextColor(0)

    doc.line(5, 54, 75, 54)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('ORIGEN', 5, 59)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Aeropuerto Intl. de Monterrey', 5, 63)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text('DESTINO', 5, 74)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(boleto.d || '-', 5, 78)
    if (boleto.a) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.text(`Zona ${boleto.a}`.substring(0, 40), 5, 82)
    }

    doc.line(5, 86, 75, 86)

    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('VEHICULO', 5, 92)
    if (boleto.p > 0) doc.text('PASAJEROS', 30, 92)
    if (boleto.q > 0) doc.text('EQUIPAJE', 55, 92)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(vehicleLabel, 5, 97)
    if (boleto.p > 0) doc.text(String(boleto.p), 30, 97)
    if (boleto.q > 0) doc.text(String(boleto.q), 55, 97)

    doc.line(5, 101, 75, 101)

    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('FECHA Y HORA', 5, 107)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(boleto.f, 5, 112)

    doc.line(5, 116, 75, 116)

    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Presenta este boleto al abordar', 40, 122, { align: 'center' })
    doc.text('tu transporte terrestre', 40, 126, { align: 'center' })

    doc.save(`boleto-${boleto.c}.pdf`)
  }

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}
    >
      <div className="mx-auto max-w-sm">
        {/* Main card */}
        <div
          className="overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
        >
          {/* Black header */}
          <div className="flex items-center justify-between bg-[#0A0A0A] px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
              Ticket de abordaje
            </p>
            <p className="text-[11px] font-bold tracking-wide text-white">{boleto.c}</p>
          </div>

          <div className="px-5 py-5">
            {/* Company + Price */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  Compania
                </p>
                <CompanyLogo name={boleto.e} />
                <p className="mt-1 text-[17px] font-bold text-black">{boleto.e}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  Total
                </p>
                <p className="mt-1 text-2xl font-bold text-[#10B981]">
                  ${boleto.t}.00
                  <span className="ml-1 text-[10px] font-medium text-gray-400">MXN</span>
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-dashed border-gray-200" />

            {/* Vehículo — accent bar ink */}
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-[3px] flex-none rounded-full bg-[#0A0A0A]" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                  Vehículo
                </p>
                <p className="mt-1 text-[18px] font-light tracking-[-0.01em] text-black">
                  {vehicleLabel}
                </p>
                {(boleto.p > 0 || boleto.q > 0) && (
                  <p className="text-[12px] text-gray-400">
                    {boleto.p > 0 && `${boleto.p} pasajeros`}
                    {boleto.p > 0 && boleto.q > 0 && ' · '}
                    {boleto.q > 0 && `${boleto.q} equipajes`}
                  </p>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-dashed border-gray-200" />

            {/* Origen — accent bar ink */}
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-[3px] flex-none rounded-full bg-[#0A0A0A]" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                  Origen
                </p>
                <p className="mt-1 text-[18px] font-light tracking-[-0.01em] text-black">
                  Aeropuerto Monterrey
                </p>
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-dashed border-gray-200" />

            {/* Destino — accent bar mint */}
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-[3px] flex-none rounded-full bg-[#10B981]" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                  Destino
                </p>
                <p className="mt-1 text-[18px] font-light tracking-[-0.01em] text-black">
                  {boleto.d || 'Tu destino'}
                </p>
                {boleto.a && <p className="text-[12px] text-gray-400">Zona {boleto.a}</p>}
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-dashed border-gray-200" />

            {/* Date */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
                Fecha y hora
              </p>
              <p className="mt-1 text-[14px] font-semibold text-black">{boleto.f}</p>
            </div>
          </div>

          {/* Tear effect */}
          <div className="relative">
            <div
              className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
              style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}
            />
            <div
              className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
              style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}
            />
            <div
              className="border-t border-dashed border-gray-300"
              style={{ marginLeft: 10, marginRight: 10 }}
            />
          </div>

          {/* Footer */}
          <div className="px-5 py-4 text-center">
            <p className="text-[12px] font-medium text-gray-400">
              Presenta este boleto al abordar tu transporte
            </p>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0A0A0A] py-4 text-[15px] font-semibold text-white active:bg-[#1A1A1A]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar boleto
        </button>

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-gray-300">
          Aeropuerto Internacional de Monterrey
        </p>
      </div>
    </div>
  )
}
