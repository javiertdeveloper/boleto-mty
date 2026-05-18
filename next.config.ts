import type { NextConfig } from 'next'

/**
 * Headers de no-cache para la ruta /v/[data].
 *
 * Razón: el browser del cliente (Chrome móvil) cachea agresivamente las
 * respuestas. Si en algún momento el Vercel respondió con un error 5xx para
 * un URL específico, Chrome puede recordar ese error y mostrar "couldn't
 * load" en futuros intentos, incluso si el server ya responde bien. Con
 * `Cache-Control: no-store` cada scan hace request fresco al server.
 *
 * Trade-off: cero benefit de CDN cache, pero el payload es chico y el
 * Vercel edge es rápido, así que el costo es mínimo. La confiabilidad
 * para un kiosko en aeropuerto pesa más.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/v/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ]
      }
    ]
  }
}

export default nextConfig
