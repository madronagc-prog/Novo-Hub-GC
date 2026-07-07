const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

content = content.replace(
  /<div className="max-w-\[1200px\] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">/,
  `<div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col w-full">
      <div className="max-w-7xl mx-auto w-full">`
);

// find the last </div> before the closing brace in MadronaLab
const lastDivIndex = content.lastIndexOf('</div>');
content = content.substring(0, lastDivIndex) + '</div>\n    </div>' + content.substring(lastDivIndex + 6);

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab layout wrapper');
