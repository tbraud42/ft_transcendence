import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    json: {
        namedExports: true
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        watch: {
            usePolling: true,
        },
    }
})
