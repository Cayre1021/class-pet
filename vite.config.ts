import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');
  const isCapacitorBuild = mode === 'capacitor';
  const isElectronMode = mode === 'electron';
  const isDesktopServe = command === 'serve' && process.env.DESKTOP === 'true';

  return {
    base: isCapacitorBuild || isElectronMode || isDesktopServe ? './' : '/class-pet/',

    plugins: [
      react(),
      tailwindcss(),
      electron({
        main: {
          entry: 'electron/main.js',
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});