const fs = require('node:fs');
fs.mkdirSync('dist', { recursive: true });
for (const file of ['index.html','login.html','signup.html','shop.html','cart.html','profile.html','app.js','config.js','styles.css']) fs.copyFileSync(file, 'dist/'+file);
