import fs from 'fs';

let content = fs.readFileSync('src/data/servicesGCData.ts', 'utf-8');
const obj = JSON.parse(content.match(/export const servicesGCData: ServiceItem\[\] = (\[[\s\S]*\]);/)[1]);

const newObj = obj.filter((item: any) => item.category !== 'Educação');

content = content.replace(/export const servicesGCData: ServiceItem\[\] = \[[\s\S]*\];/, `export const servicesGCData: ServiceItem[] = ${JSON.stringify(newObj, null, 2)};`);
fs.writeFileSync('src/data/servicesGCData.ts', content);
