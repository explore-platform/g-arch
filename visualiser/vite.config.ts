import react from '@vitejs/plugin-react'
import { resolve } from "path";
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
// import GlobalPolyFill from "@esbuild-plugins/node-globals-polyfill";
import { defineConfig } from 'vite'



// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    build:{
        outDir: 'build'
    },
    define:{
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [react()],
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    process: true,
                    buffer: true,
                }),
            ],
        },
    },
    resolve: {
        alias: {
            process: "process/browser",
            stream: "stream-browserify",
            zlib: "browserify-zlib",
            util: "util",
        },
    },
})



// export default defineConfig({
//     build:{
//         outDir: 'build'
//     },
//     optimizeDeps: {
//         esbuildOptions: {
//             define: {
//                 global: "globalThis",
//             },
//             plugins: [
//                 NodeGlobalsPolyfillPlugin({
//                     process: true,
//                     buffer: true,
//                 }),
//             ],
//         },
//     },
//     plugins: [react()]
// })