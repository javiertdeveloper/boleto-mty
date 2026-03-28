'use client'

import { useState, useMemo, use } from 'react'

interface BoletoData {
  c: string  // controlNumber
  e: string  // empresa
  d: string  // destino
  a: string  // address
  t: number  // total
  v: string  // vehicleType
  p: number  // pasajeros
  q: number  // equipaje
  f: string  // fecha
}

function decodeBoleto(encoded: string): BoletoData | null {
  try {
    const json = decodeURIComponent(atob(decodeURIComponent(encoded)))
    const data = JSON.parse(json)
    if (!data.c || !data.e) return null
    return data as BoletoData
  } catch {
    return null
  }
}

const LOGO_KEYWORDS: [string, string][] = [
  ['suburban', 'SUBURBAN'], ['timovil', 'TIMOVIL'], ['golden', 'GOLDEN'],
  ['ecofy', 'ECOFY'], ['ejecutivo', 'EJECUTIVO'], ['contaxi', 'CONTAXI'],
  ['totsa plus', 'TPLUS'], ['tplus', 'TPLUS'], ['totsa', 'TOTSA'],
  ['tpa', 'TPA'], ['mundo verde', 'MUNDOVERDE'], ['privauto', 'PRIVAUTO'],
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
    <img
      src={`/logos/${file}.jpg`}
      alt={name}
      onError={() => setShow(false)}
      className="mt-1 rounded object-contain"
      style={{ height: 40, width: 'auto', maxWidth: '100%' }}
    />
  )
}

function ErrorView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function BoletoPage({ params }: { params: Promise<{ data: string }> }) {
  const { data: encoded } = use(params)
  const boleto = useMemo(() => decodeBoleto(encoded), [encoded])

  if (!boleto) return <ErrorView />

  const vehicleLabel = boleto.v === 'suv' ? 'Camioneta' : boleto.v === 'sedan' ? 'Sedan' : boleto.v

  const handleDownload = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('AEROPUERTO INTERNACIONAL', 40, 10, { align: 'center' })
    doc.text('DE MONTERREY', 40, 15, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Terminal C', 40, 20, { align: 'center' })

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
    doc.text('Terminal C', 5, 67)

    doc.setFontSize(6)
    doc.text('DESTINO', 5, 74)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(boleto.d, 5, 78)
    if (boleto.a) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.text(boleto.a.substring(0, 40), 5, 82)
    }

    doc.line(5, 86, 75, 86)

    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('VEHICULO', 5, 92)
    doc.text('PASAJEROS', 30, 92)
    doc.text('EQUIPAJE', 55, 92)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(vehicleLabel, 5, 97)
    doc.text(String(boleto.p), 30, 97)
    doc.text(String(boleto.q), 55, 97)

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
    <div className="min-h-screen px-4 py-6" style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }}>
      <div className="mx-auto max-w-sm">
        {/* Main card */}
        <div className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          {/* Black header */}
          <div className="flex items-center justify-between bg-[#0A0A0A] px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
              Ticket de abordaje
            </p>
            <p className="text-[11px] font-bold tracking-wide text-white">
              {boleto.c}
            </p>
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

            {/* Origin */}
            <div className="flex items-start gap-2.5">
              <div className="mt-[7px] h-[10px] w-[10px] flex-none rounded-full bg-[#3B82F6]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Origen</p>
                <p className="mt-0.5 text-[14px] font-semibold text-black">
                  Aeropuerto Internacional de Monterrey
                </p>
                <p className="text-[12px] text-gray-400">Terminal C</p>
              </div>
            </div>

            {/* Dashed connector */}
            <div className="my-1.5 ml-[4px] border-l-2 border-dashed border-gray-200" style={{ height: 16 }} />

            {/* Destination */}
            <div className="flex items-start gap-2.5">
              <div className="mt-[7px] h-[10px] w-[10px] flex-none rounded-full bg-[#10B981]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Destino</p>
                <p className="mt-0.5 text-[14px] font-semibold text-black">{boleto.d}</p>
                {boleto.a && <p className="text-[12px] text-gray-400">{boleto.a}</p>}
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-dashed border-gray-200" />

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Vehiculo</p>
                <p className="mt-1 text-[15px] font-bold text-black">{vehicleLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Pasajeros</p>
                <p className="mt-1 text-[22px] font-bold leading-none text-black">{boleto.p}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Equipaje</p>
                <p className="mt-1 text-[22px] font-bold leading-none text-black">{boleto.q}</p>
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-dashed border-gray-200" />

            {/* Date */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Fecha y hora</p>
              <p className="mt-1 text-[14px] font-semibold text-black">{boleto.f}</p>
            </div>
          </div>

          {/* Tear effect */}
          <div className="relative">
            <div className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }} />
            <div className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" style={{ background: 'linear-gradient(180deg, #f8f8f8, #f0f0f0)' }} />
            <div className="border-t border-dashed border-gray-300" style={{ marginLeft: 10, marginRight: 10 }} />
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar boleto
        </button>

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-gray-300">
          Aeropuerto Internacional de Monterrey — Terminal C
        </p>
      </div>
    </div>
  )
}
