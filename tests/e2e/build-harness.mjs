import esbuild from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outdir = path.join(root, "tests/e2e/.dist");

await mkdir(outdir, { recursive: true });
await copyFile(path.join(root, "styles.css"), path.join(outdir, "styles.css"));

await esbuild.build({
  entryPoints: [path.join(root, "tests/e2e/harness.tsx")],
  outfile: path.join(outdir, "harness.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  plugins: [
    {
      name: "src-alias",
      setup(build) {
        build.onResolve({ filter: /^@\// }, (args) => ({
          path: resolveSourceAlias(args.path)
        }));
      }
    }
  ]
});

await writeFile(
  path.join(outdir, "index.html"),
  `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>J Chat Playwright Harness</title>
    <link rel="stylesheet" href="./styles.css" />
    <style>
      html, body, #root { height: 100%; margin: 0; }
      body {
        --background-primary: hsl(240 10% 3.9%);
        --background-secondary: hsl(240 3.7% 15.9%);
        --background-modifier-border: hsl(240 3.7% 24%);
        --background-modifier-hover: hsl(240 3.7% 18%);
        --text-normal: hsl(0 0% 98%);
        --text-muted: hsl(240 5% 64.9%);
        --interactive-accent-hsl: 210 85% 52%;
        background: var(--background-primary);
      }
      #root { width: 390px; border-right: 1px solid var(--background-modifier-border); }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="./harness.js"></script>
  </body>
</html>
`
);

function resolveSourceAlias(importPath) {
  const base = path.join(root, "src", importPath.slice(2));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (existsSync(candidate)) return candidate;
  }
  return base;
}
