import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Boleto de Transporte — Aeropuerto MTY',
  description: 'Tu boleto de transporte terrestre — Aeropuerto Internacional de Monterrey, Terminal C',
  openGraph: {
    title: 'Boleto de Transporte — Aeropuerto MTY',
    description: 'Tu boleto de transporte terrestre',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
