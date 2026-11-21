// Leonida Trophy Guide — the hand-in program. Node 22, standard library only.
// It gathers the guide (app/) and its screenshots (screenshots/) from beside
// this file, copies them into the output directory, and writes the dossier the
// judge reads, using the vendored make.fun library. The build is deterministic:
// run it twice and both runs write the same bytes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide itself with `node serve.ts` (http://localhost:8080).
// Round 2: the guide it bundles now cites 290 sources across 10 sites (5–6 per trophy); the build is unchanged.
// Round 3: the guide it bundles now cites 390 sources across 16 sites (7–8 per trophy), with an audit bar, numbered cited steps, disputes both ways, per-trophy source counts and counters; the build is unchanged.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's caps: at most 4 screenshots of at most 256 KiB each, at most 993
// files and 48 MiB under app/, and the dossier text at most 160 KiB. The
// dossier is built from the copied files, so what lands in /output is exactly
// what the gate scores.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
