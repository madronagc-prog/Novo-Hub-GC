const { servicesGCData } = require('./temp_out/servicesGCData.js');
const fs = require('fs');

const userList = [
  { cat: 'Doutrina', items: ['Biblioteca do Escritório', 'Minha Biblioteca', 'Proview', 'RT Online'] },
  { cat: 'Inteligência Artificial', items: ['Saga'] },
  { cat: 'Jurisprudência', items: ['Decisões', 'Jusbrasil', 'Turivius'] },
  { cat: 'Legislação', items: ['Checkpoint', 'ComexContent', 'Econet', 'RC Ambiental'] },
  { cat: 'Notícias', items: ['Agência Infra', 'Capital Aberto', 'Estadão', 'Folha', 'Jota', 'MegaWhat', 'O Globo', 'Portal da Reforma Tributária', 'Resenha de Notícias Fiscais', 'Revista Exame', 'Valor Econômico'] },
  { cat: 'Assinatura Digital', items: ['D4Sign', 'DocuSign', 'CertiSign'] },
  { cat: 'Due Diligence', items: ['PortData', 'Lexter', 'Registradores', 'UpMiner'] },
  { cat: 'Educação', items: ['Head Energia'] }
];

const oldMap = new Map();
servicesGCData.forEach(s => oldMap.set(s.name.toLowerCase(), s));
oldMap.set('decisões', oldMap.get('decisoes'));
oldMap.set('rt online', oldMap.get('rt online'));

const newServices = [];

userList.forEach(group => {
  group.items.forEach(itemName => {
    let oldObj = oldMap.get(itemName.toLowerCase());
    
    if (!oldObj) {
      const match = Array.from(oldMap.values()).find(s => s.name.toLowerCase() === itemName.toLowerCase() || (s.fullName && s.fullName.toLowerCase() === itemName.toLowerCase()));
      if (match) oldObj = match;
    }

    if (oldObj) {
      newServices.push({
        id: oldObj.id,
        name: itemName,
        fullName: oldObj.fullName || '',
        provider: oldObj.provider || '',
        description: oldObj.description || '',
        featureGroups: oldObj.featureGroups || [],
        accessInfo: oldObj.accessInfo || '',
        areas: oldObj.areas || '',
        category: group.cat
      });
    } else {
      const idStr = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      newServices.push({
        id: idStr,
        name: itemName,
        description: '',
        featureGroups: [],
        accessInfo: '',
        category: group.cat
      });
    }
  });
});

let tsCode = `// src/data/servicesGCData.ts
export interface ServiceFeatureGroup {
  title: string;
  items: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  fullName?: string;
  provider?: string;
  description: string;
  featureGroups: ServiceFeatureGroup[];
  accessInfo: string;
  areas?: string;
  category: string;
}

export const CATEGORIES = [
  'Doutrina',
  'Inteligência Artificial',
  'Jurisprudência',
  'Legislação',
  'Notícias',
  'Assinatura Digital',
  'Due Diligence',
  'Educação'
];

export const servicesGCData: ServiceItem[] = ${JSON.stringify(newServices, null, 2)};
`;

fs.writeFileSync('src/data/servicesGCData.ts', tsCode);
console.log('done');
