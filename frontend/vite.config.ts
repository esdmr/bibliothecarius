import process from 'node:process';
import {defineConfig} from 'vite';

function ensureTrailingSlash(url: string) {
    return url.endsWith('/') ? url : url + '/';
}

export default defineConfig(({mode}) => ({
    base: ensureTrailingSlash(process.env.BASE_URL ?? '/'),
    cacheDir: 'node_modules/.cache/vite',
    build: {
        target: ['firefox103', 'chrome104'],
        outDir: 'build',
        rollupOptions: {
            input: ['index.html'],
        },
        sourcemap: mode !== 'production',
        minify: mode === 'production',
    },
    esbuild: {
        jsx: 'automatic',
        jsxFactory: 'createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'preact',
        jsxDev: mode !== 'production',
    },
}));
