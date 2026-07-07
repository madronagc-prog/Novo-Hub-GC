const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = "import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';\n" + content;

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('Fixed Layout react-router-dom import');
