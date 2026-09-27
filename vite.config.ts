import { defineConfig, type AliasOptions, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Absolute site URL for canonical + social-preview tags (WhatsApp/LinkedIn need
 * absolute image URLs). Set SITE_URL (e.g. https://nandinidas.com) in Vercel →
 * Settings → Environment Variables, or it falls back to Vercel's production domain.
 */
function siteUrlPlugin(): Plugin {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = (process.env.SITE_URL || (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");
  return {
    name: "site-url",
    transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", url),
  };
}

export default defineConfig(({ mode }) => {
  // The leva dev panel is hidden in production — ship a tiny stub instead.
  const alias: AliasOptions =
    mode === "production" ? { leva: fileURLToPath(new URL("./src/lib/levaStub.ts", import.meta.url)) } : {};

  return {
    plugins: [react(), siteUrlPlugin()],
    resolve: { alias },
    build: {
      rollupOptions: {
        output: {
          // Split the big, rarely-changing libraries into their own cacheable files.
          manualChunks: {
            three: ["three"],
            r3f: ["@react-three/fiber", "@react-three/postprocessing", "postprocessing"],
            gsap: ["gsap", "@gsap/react"],
          },
        },
      },
    },
  };
});
