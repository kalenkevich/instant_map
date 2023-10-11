import fs from 'fs';
import * as esbuild from 'esbuild';
import { htmlPlugin } from '@craftamap/esbuild-plugin-html';

const htmlTemplate = fs.readFileSync('./public/index.html', 'utf8');

const serveMode = process.argv[2] === '--serve';

const buildConfig = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outdir: './dist',
  bundle: true,
  minify: true,
  metafile: true,
  sourcemap: 'linked',
  logLevel: 'info',
  plugins: [
    htmlPlugin({
      files: [{
        entryPoints: ['src/index.ts'],
        filename: 'index.html',
        htmlTemplate,
        hash: true,
      }],
    }),
  ],
};

if (serveMode) {
  const ctx = await esbuild.context(buildConfig);

  await ctx.watch();
  await ctx.serve({
    port: 8080,
    servedir: './dist',
  });
} else {
  await esbuild.build(buildConfig);
}