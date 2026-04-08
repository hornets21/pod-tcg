const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
const version = `v=${timestamp}`;

console.log(`[CacheBuster] Updating version to: ${version}`);

let content = fs.readFileSync(indexPath, 'utf8');

// Regex to match .css, .js files that are local (don't have http in front)
// This will match href="style.css" or src="script.js" and add/update ?v=...
const linkRegex = /(href|src)="([^"]+\.(?:css|js))(?:\?v=[^"]*)?"/g;

const newContent = content.replace(linkRegex, (match, attr, file) => {
    // Skip external links
    if (file.startsWith('http') || file.startsWith('//')) {
        return match;
    }
    console.log(`  Updating ${file}`);
    return `${attr}="${file}?${version}"`;
});

fs.writeFileSync(indexPath, newContent);
console.log(`[CacheBuster] Done! Updated index.html`);
