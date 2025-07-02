import { defineConfig } from "vite";

export default defineConfig({
    // to find the assets
    base: "./",
    build: {
        // terser, since kaboom has a bug
        minify: "terser",
    },  
})