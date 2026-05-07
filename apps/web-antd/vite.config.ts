import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {
      devtools: false,
      injectMetadata: false,
      nitroMock: false,
      print: false,
      pwa: false,
      vxeTableLazyImport: false,
    },
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            // target: 'http://localhost:5320/api',
            target: 'http://106.55.183.213:18081',
            ws: true,
          },
        },
      },
    },
  };
});
