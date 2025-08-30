import { defineConfig } from "@solidjs/start/config";
import suidPlugin from "@suid/vite-plugin";

export default defineConfig({
  vite: {
    plugins: [suidPlugin()],
    build: {
      target: "esnext",
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        host: "localhost",
        protocol: "ws",
        port: 24678,
        clientPort: 24678
      }
    }
  },
});