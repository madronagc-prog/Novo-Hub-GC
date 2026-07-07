const fs = require('fs');
let content = fs.readFileSync('src/pages/MadronaLab.tsx', 'utf8');

// Add Trash2 to lucide-react import
content = content.replace(
  "import { Search, ChevronDown, Plus, Pencil, X, Loader2, CheckCircle2 } from 'lucide-react';",
  "import { Search, ChevronDown, Plus, Pencil, X, Loader2, CheckCircle2, Trash2 } from 'lucide-react';"
);

// Add showConfirmDelete state
const stateInsertion = "const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');\n  const [showConfirmDelete, setShowConfirmDelete] = useState(false);\n";
content = content.replace("const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');", stateInsertion);

// Add deleteDoc import
content = content.replace(
  "import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';",
  "import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';"
);

// Fix closeEdit
content = content.replace(
  /const closeEdit = \(\) => \{\s*setEditingId\(null\);\s*setEditForm\(\{\}\);\s*setSaveStatus\('idle'\);\s*\};/,
  `const closeEdit = () => {
    if (saving) return;
    setEditingId(null);
    setEditForm({});
    setSaveStatus('idle');
    setShowConfirmDelete(false);
  };`
);

// Add handleDelete
const handleDeleteStr = `  const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'madronaLab', editingId));
      setServices(prev => prev.filter(s => s.id !== editingId));
      closeEdit();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setSaveStatus('error');
      setSaving(false);
    }
  };
`;
content = content.replace("const saveEdit = async () => {", handleDeleteStr + "\n  const saveEdit = async () => {");


// Insert featureGroups editor
const fgEditor = `
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest">
                    Principais informações
                  </label>
                  <button
                    onClick={() => setEditForm(f => ({ ...f, featureGroups: [...(f.featureGroups || []), { title: '', items: [] }] }))}
                    className="text-brand-blue hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <Plus size={12} />
                    Adicionar grupo
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editForm.featureGroups || []).map((group, groupIndex) => (
                    <div key={groupIndex} className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <input
                          type="text"
                          value={group.title}
                          onChange={e => {
                            const newGroups = [...(editForm.featureGroups || [])];
                            newGroups[groupIndex].title = e.target.value;
                            setEditForm(f => ({ ...f, featureGroups: newGroups }));
                          }}
                          placeholder="Título do grupo"
                          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm font-semibold text-brand-grafite focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                        <button
                          onClick={() => {
                            const newGroups = [...(editForm.featureGroups || [])];
                            newGroups.splice(groupIndex, 1);
                            setEditForm(f => ({ ...f, featureGroups: newGroups }));
                          }}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors"
                          title="Remover grupo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <textarea
                        rows={3}
                        value={group.items.join('\\n')}
                        onChange={e => {
                          const newGroups = [...(editForm.featureGroups || [])];
                          newGroups[groupIndex].items = e.target.value.split('\\n');
                          setEditForm(f => ({ ...f, featureGroups: newGroups }));
                        }}
                        placeholder="Lista de itens (um por linha)"
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                      />
                    </div>
                  ))}
                  
                  {(!editForm.featureGroups || editForm.featureGroups.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 text-gray-400 text-sm">
                      Nenhuma informação cadastrada.
                    </div>
                  )}
                </div>
              </div>
`;
content = content.replace(
  '              <div>\n                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">\n                  Áreas Envolvidas\n                </label>',
  '              <div>\n                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">\n                  Áreas Envolvidas\n                </label>'
);
// Actually let's insert it before closing the form div
content = content.replace(
  '            </div>\n            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">',
  fgEditor + '\n            </div>\n            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">'
);


// And update footer
const footerStr = `
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-4">
                {editingId && !editingId.startsWith('new-') && !showConfirmDelete && (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    disabled={saving}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {showConfirmDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium mr-2">Excluir?</span>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
                <div className="text-sm min-h-[20px] ml-4">
                  {saveStatus === 'success' && <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 size={14} /> Salvo</span>}
                  {saveStatus === 'error' && <span className="flex items-center gap-1.5 text-red-600"><X size={14} /> Erro ao salvar</span>}
                </div>
              </div>
`;
content = content.replace(
  /<div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">\s*<div className="text-sm min-h-\[20px\]">\s*\{saveStatus === 'success'[\s\S]*?<\/div>/,
  footerStr
);


fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('Fixed MadronaLab edit form');
