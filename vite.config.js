import { readFileSync, existsSync, cpSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { checkPublicAssets } from './scripts/check-public-assets.mjs';

const hasCertificate = existsSync('.cert/key.pem') && existsSync('.cert/cert.pem');
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [{ name: 'release-assets', apply: 'build', buildStart() { checkPublicAssets(); }, closeBundle() {
    cpSync('docs', 'dist/docs', { recursive: true });
    for (const name of ['LICENSE','THIRD_PARTY_NOTICES.md']) cpSync(name,`dist/${name}`);
  } }],
  server: { allowedHosts: [loadEnv(mode,process.cwd(),'LOCAL_').LOCAL_ALLOWED_HOST].filter(Boolean), ...(hasCertificate ? { https: {
    key: readFileSync('.cert/key.pem'),
    cert: readFileSync('.cert/cert.pem'),
  } } : {}) },
}));
