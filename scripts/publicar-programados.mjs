// scripts/publicar-programados.mjs
// Publica los artículos marcados con `draft: true # programado` cuyo pubDate ya llegó.
// Lo ejecuta .github/workflows/publicar-programados.yml una vez al día; el push a main
// dispara el despliegue en Dokploy. Los borradores sin la marca no se tocan.
//
// Uso: node scripts/publicar-programados.mjs            (fecha de hoy en PUBLISH_TZ)
//      TODAY=2026-11-28 node scripts/publicar-programados.mjs   (simular una fecha)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/content/blog';
const TZ = process.env.PUBLISH_TZ || 'America/El_Salvador';
// en-CA formatea como YYYY-MM-DD.
const today = process.env.TODAY || new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

const published = [];
for (const file of readdirSync(DIR)) {
  if (!file.endsWith('.md') || file.startsWith('_')) continue;
  const path = join(DIR, file);
  const text = readFileSync(path, 'utf8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const scheduled = /^draft:\s*true\s*#\s*programado\s*$/m.test(fm[1]);
  const date = fm[1].match(/^pubDate:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1];
  if (!scheduled || !date || date > today) continue;
  const newFm = fm[1].replace(/^draft:\s*true\s*#\s*programado\s*$/m, 'draft: false');
  writeFileSync(path, text.replace(fm[1], newFm));
  published.push(`${date} ${file}`);
}

console.log(`Hoy (${TZ}): ${today}`);
console.log(published.length ? `Publicados:\n${published.join('\n')}` : 'Nada que publicar.');
