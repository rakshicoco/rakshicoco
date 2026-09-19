import { execSync } from 'child_process';
import fs from 'fs';

console.log('--- GIT AUDIT START ---');

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    return err.stdout ? err.stdout.trim() : '';
  }
}

// 1. git log -S"service_role" --all --oneline
console.log('=== git log -S"service_role" --all --oneline ===');
const srLog = runGit('git --no-pager log -S"service_role" --all --oneline');
console.log(srLog || '(none)');

// 2. git log -S"SUPABASE_SERVICE_ROLE_KEY" --all --oneline
console.log('=== git log -S"SUPABASE_SERVICE_ROLE_KEY" --all --oneline ===');
const srkLog = runGit('git --no-pager log -S"SUPABASE_SERVICE_ROLE_KEY" --all --oneline');
console.log(srkLog || '(none)');

// 3. Search tracked files
console.log('=== Tracked Files Audit ===');
const trackedFiles = runGit('git ls-files').split('\n').map(f => f.trim()).filter(Boolean);

const findings = [];
const patterns = [
  { name: 'service_role reference', re: /service_role/g },
  { name: 'SUPABASE_SERVICE_ROLE_KEY variable', re: /SUPABASE_SERVICE_ROLE_KEY/g },
  { name: 'JWT Token pattern', re: /eyJhbGciOiJIUzI1Ni[A-Za-z0-9_-]+/g }
];

for (const file of trackedFiles) {
  if (!fs.existsSync(file)) continue;
  try {
    const stat = fs.statSync(file);
    if (stat.size > 2 * 1024 * 1024) continue; // skip > 2MB binaries
    const content = fs.readFileSync(file, 'utf-8');
    
    for (const pat of patterns) {
      if (pat.re.test(content)) {
        // Find line numbers
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (pat.re.test(line)) {
            // NEVER print secret value - redact anything looking like a token
            const isActualToken = /eyJhbGciOiJIUzI1Ni[A-Za-z0-9_-]{20,}/.test(line);
            findings.push({
              file,
              line: idx + 1,
              type: isActualToken ? 'Literal JWT Token (REDACTED)' : pat.name
            });
          }
        });
      }
    }
  } catch (e) {
    // binary or read error, ignore
  }
}

console.log('Findings in tracked files (count: ' + findings.length + '):');
for (const f of findings) {
  console.log(`- file: ${f.file}:${f.line} | type: ${f.type}`);
}

console.log('--- GIT AUDIT END ---');
