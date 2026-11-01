import {readFileSync} from 'node:fs';
const [file,...expected]=process.argv.slice(2);
if(!file||!expected.length)throw Error('Need Wrangler JSON path and required table names');
const raw=readFileSync(file,'utf8');
const results=JSON.parse(raw);
const groups=Array.isArray(results)?results:[results];
const names=new Set(groups.flatMap(item=>item?.results||[]).map(row=>row.name));
for(const name of expected)
 if(!names.has(name))throw Error('Production D1 does not contain required table: '+name);
console.log('Verified D1 table names: '+expected.join(', '));
