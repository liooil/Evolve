#!/usr/bin/env bun

import { context, build } from "esbuild";
import { lessLoader } from "esbuild-plugin-less";

if (process.env.NODE_ENV === "production") {
  build({
    logLevel: "info",
    entryPoints: [
      { in: "src/main.js", out: "evolve/main" },
      { in: "src/evolve.less", out: "evolve/evolve" },
      { in: "src/wiki/wiki.js", out: "wiki/wiki" },
      { in: "src/wiki/wiki.less", out: "wiki/wiki" },
      "index.html",
      "wiki.html",
      "save.html",
      "evolved.ico",
      "evolved-light.ico",
    ],
    plugins: [lessLoader()],
    loader: {
      ".html": "copy",
      ".ico": "binary",
      ".png": "binary",
    },
    bundle: true,
    minify: true,
    outdir: "dist",
  })
    .catch(() => process.exit(1));
  } else {
  const ctx = await context({
      logLevel: "info",
      entryPoints: [
        { in: "src/main.js", out: "evolve/main" },
        { in: "src/evolve.less", out: "evolve/evolve" },
        { in: "src/wiki/wiki.js", out: "wiki/wiki" },
        { in: "src/wiki/wiki.less", out: "wiki/wiki" },
        "index.html",
        "wiki.html",
        "save.html",
        "evolved.ico",
        "evolved-light.ico",
      ],
      plugins: [lessLoader()],
      loader: {
        ".html": "copy",
        ".ico": "binary",
        ".png": "binary",
      },
      bundle: true,
      minify: false,
      sourcemap: true,
      outdir: "dist",
    });
    
    ctx.watch()
      .catch(() => process.exit(1))
}

