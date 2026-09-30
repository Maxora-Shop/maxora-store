const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(full);
    }
  }
  return fileList;
}

const files = walk('.');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/\bsettings\b/.test(line)) {
      if (!line.includes('interface ') && !line.includes('type ') && !line.includes('const ') && !line.includes('let ') && !line.includes('var ') && !line.includes('settings:') && !line.includes('settingsForm') && !line.includes('globalSettings') && !line.includes('defaultSettings') && !line.includes('db.settings') && !line.includes('StoreSettings')) {
        console.log(`${f}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
}
