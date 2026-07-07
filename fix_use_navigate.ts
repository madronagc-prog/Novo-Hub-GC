import fs from 'fs';

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace("import { BrowserRouter, HashRouter, Routes, Route, Navigate }", "import { BrowserRouter, HashRouter, Routes, Route, Navigate, useNavigate }");
// wait layout uses useLocation which is imported below:
content = content.replace("import { useLocation, useNavigate } from 'react-router-dom';", "import { useLocation, useNavigate, Link } from 'react-router-dom';");

fs.writeFileSync('src/components/Layout.tsx', content);
