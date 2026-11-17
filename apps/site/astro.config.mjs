import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

const siteRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(siteRoot, "../..");
const firebaseJson = JSON.parse(
  readFileSync(resolve(repositoryRoot, "firebase.json"), "utf8"),
);
const firebaseRc = JSON.parse(
  readFileSync(resolve(repositoryRoot, ".firebaserc"), "utf8"),
);

const projectId = firebaseRc.projects?.default;
const functionRoutes = (firebaseJson.hosting?.rewrites ?? []).filter(
  (rewrite) => rewrite.function?.functionId,
);
const functionRegion = functionRoutes[0]?.function?.region;

if (!projectId || !functionRegion) {
  throw new Error(
    "Local function proxy needs the default Firebase project and function region from .firebaserc/firebase.json.",
  );
}

const functionsProxy = Object.fromEntries(
  functionRoutes.map((rewrite) => {
    const route = rewrite.source;
    const functionId = rewrite.function.functionId;
    const region = rewrite.function.region || functionRegion;

    return [
      route,
      {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        rewrite: () => `/${projectId}/${region}/${functionId}`,
      },
    ];
  }),
);

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        "@": resolve(siteRoot, "src"),
      },
    },
    server: {
      proxy: functionsProxy,
    },
  },
});
