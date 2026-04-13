const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
const version = `v=${timestamp}`;

console.log(`[CacheBuster] Updating version to: ${version}`);

let content = fs.readFileSync(indexPath, 'utf8');

// Regex to match .css, .js files that are local
// This will match href="style.css" or src="script.js?v=..." or src="script.js?any=param" 
// and replace/add the version parameter.
const linkRegex = /(href|src)="([^"?(?:http)]+\.(?:css|js))(?:\?[^"]*)?"/g;

const newContent = content.replace(linkRegex, (match, attr, file) => {
    console.log(`  Updating ${file}`);
    return `${attr}="${file}?${version}"`;
});

fs.writeFileSync(indexPath, newContent);
console.log(`[CacheBuster] Done! Updated index.html`);
