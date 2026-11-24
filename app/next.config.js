/** @type {import('next').NextConfig} */
// En JavaScript plano a propósito: si el archivo fuera .ts, Next tendría que
// cargar jiti para transpilarlo antes de arrancar, y eso agrega un punto de
// falla en el inicio del servidor.
const nextConfig = {
  // La demo (npm run demo) corre en paralelo a la app real: cada una necesita
  // su propia carpeta de compilación o se pisan.
  distDir: process.env.GESI_DIST_DIR || '.next',
  experimental: {
    serverActions: {
      // Por defecto es 1 MB y un escaneo lo pasa fácil. Alcanza para subir
      // varios archivos de una vez (el máximo por archivo está en
      // src/lib/documentos.ts).
      bodySizeLimit: '100mb'
    }
  }
}

module.exports = nextConfig
