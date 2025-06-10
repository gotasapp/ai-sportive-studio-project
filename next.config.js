/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Configuração para arquivos binários
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    })

    // Configuração para arquivos WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // Configuração para arquivos ONNX
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    return config
  },
}

module.exports = nextConfig 