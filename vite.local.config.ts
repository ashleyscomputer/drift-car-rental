import { defineConfig, loadEnv } from 'vite';
import vinext from 'vinext';
import { nitro } from 'nitro/vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode, command }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    environments: {
      rsc: { resolve: { external: ['mysql2', 'mysql2/promise'] } },
      ssr: { resolve: { external: ['mysql2', 'mysql2/promise'] } },
    },
    server: { host: '127.0.0.1', port: 3000 },
    plugins: [
      tailwindcss(),
      vinext(),
      ...(command === 'build' ? [nitro({ preset: 'node-server' })] : []),
    ],
  };
});
