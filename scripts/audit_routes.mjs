import fs from 'fs';
import path from 'path';

function getFiles(dir, exts = ['.tsx', '.ts']) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getFiles(full, exts));
    } else if (exts.includes(path.extname(item.name))) {
      files.push(full);
    }
  }
  return files;
}

const files = getFiles('src');
// Match href="/dashboard/..." or href={`/dashboard/...`}
const hrefRegex = /href=["'`](\/dashboard\/[^"'`?#]*)/g;
const templateRegex = /href=\{`(\/dashboard\/[^`?#$]*)[`$]/g;
const links = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    links.push({ href: match[1], file: path.relative(process.cwd(), file) });
  }
  while ((match = templateRegex.exec(content)) !== null) {
    links.push({ href: match[1], file: path.relative(process.cwd(), file) });
  }
}

// Check existing routes
function getRoutes(dir, base = '') {
  let routes = [];
  if (!fs.existsSync(dir)) return routes;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      routes = routes.concat(getRoutes(path.join(dir, item.name), base + '/' + item.name));
    } else if (item.name === 'page.tsx') {
      routes.push(base === '' ? '/' : base);
    }
  }
  return routes;
}

const routes = getRoutes('src/app');
console.log('--- ALL CURRENT ROUTES IN src/app (' + routes.length + ') ---');
routes.sort().forEach(r => console.log(r));

console.log('\n--- CHECKING LINK TARGETS ---');
const missing = [];
const seenHrefs = new Set();
for (const item of links) {
  let matched = false;
  // Normalize dynamic routes
  for (const route of routes) {
    const routeRegex = new RegExp('^' + route.replace(/\[([^\]]+)\]/g, '[^/]+') + '$');
    if (routeRegex.test(item.href) || item.href === route) {
      matched = true;
      break;
    }
    // Also check if item.href matches route prefix for dynamic segment like /dashboard/purchases/ when template was /dashboard/purchases/${pur.id}
    if (item.href.endsWith('/') && (route + '/').startsWith(item.href)) {
      matched = true;
      break;
    }
  }
  if (!matched && !seenHrefs.has(item.href)) {
    seenHrefs.add(item.href);
    missing.push(item);
  }
}

console.log('\nTotal broken / nonexistent link targets found:', missing.length);
missing.forEach(m => console.log('BROKEN: ' + m.href + ' (in ' + m.file + ')'));
