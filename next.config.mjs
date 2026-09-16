/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática: el corpus es inmutable entre publicaciones, así que
  // no hace falta servidor ni base de datos en producción.
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
