const fs = require('fs');

const rawOldData = fs.readFileSync('src/data/servicesGCData.ts', 'utf-8');

// A VERY dirty way to extract the old data, but since it's TS, maybe I can just compile it to JS and require it.
