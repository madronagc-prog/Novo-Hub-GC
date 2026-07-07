import fs from 'fs';

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!content.includes('const navigate = useNavigate();')) {
  content = content.replace("const location = useLocation();", "const location = useLocation();\n  const navigate = useNavigate();");
  if (!content.includes('useNavigate')) {
    content = content.replace("useLocation", "useLocation, useNavigate");
  }
}

content = content.replace("window.location.href = item.path;", "navigate(item.path);");

fs.writeFileSync('src/components/Layout.tsx', content);
