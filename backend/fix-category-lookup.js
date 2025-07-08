const fs = require('fs');

// Read the file
const filePath = 'src/controllers/supply-output.controller.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace productCategories with categories in lookup
content = content.replace(/from: "productCategories",/g, 'from: "categories",');

// Write back to file
fs.writeFileSync(filePath, content);

console.log('Fixed category lookup in supply-output.controller.ts'); 