const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

const adminEmailsCode = `
// ──────────────────────────────────────────────────────────────────────────
// Emails com permissão de edição
// ──────────────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  'carnivalofdisgustblog@gmail.com',
  'gc.madronafialho@gmail.com',
  'andrezzasoares08@gmail.com',
  'amandacarvaleite@gmail.com',
  'madrona.gc@gmail.com',
];

function checkIsAdmin(user: User | null): boolean {
  return !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}
`;

// Insert the code just before export default function MadronaLab()
content = content.replace("export default function MadronaLab() {", adminEmailsCode + "\nexport default function MadronaLab() {");

// Replace states
const statesRegex = /const \[isAdmin, setIsAdmin\] = useState\(false\);\s*const \[loadingAuth, setLoadingAuth\] = useState\(true\);/;
const statesReplacement = `const [user, setUser] = useState<User | null>(null);
  const isAdmin = checkIsAdmin(user);`;
content = content.replace(statesRegex, statesReplacement);

// Replace useEffect checkAdmin
const checkAdminRegex = /useEffect\(\(\) => \{\s*const checkAdmin = async \([\s\S]*?\}, \[\]\);/;
const checkAdminReplacement = `useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);`;
content = content.replace(checkAdminRegex, checkAdminReplacement);

// Fix console.error
content = content.replace(/console\.error\("Erro ao carregar madronaLab:", error\);/g, "console.warn('[MadronaLab] erro ao carregar do Firestore:', error);");

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab admin check and console.error');
