import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const load=createRequire(import.meta.url);const braces=load('braces');const globCaller=createRequire(load.resolve('fast-glob'));const matchCaller=createRequire(globCaller.resolve('micromatch'));
assert.equal(matchCaller('braces/package.json').version,'3.0.4-blend-security.1','resolve the source patch before exercising bounded guards');
function ast(depth,type='brace'){let node={type:'text',value:'a'};for(let i=0;i<depth;i++)node={type,nodes:[node]};return {type:'root',nodes:[node]};}
function nested(depth,kind='brace'){return kind==='paren'?'('.repeat(depth)+'a'+')'.repeat(depth):kind==='mixed'?'{('.repeat(depth)+'a,b'+')}'.repeat(depth):'{'.repeat(depth)+'a,b'+'}'.repeat(depth);}
test('real fast-glob and micromatch resolve the maintained source patch',()=>{
 assert.equal(matchCaller('braces/package.json').version,'3.0.4-blend-security.1');assert.equal(matchCaller.resolve('braces'),path.resolve(__dirname,'../vendor/braces/index.js'));assert.equal(load.resolve('braces'),matchCaller.resolve('braces'));
 assert.throws(()=>matchCaller('braces').compile(nested(4096)),/exceeds max depth/);
 assert.throws(()=>matchCaller('micromatch').braces(nested(4096)),/exceeds max depth/);
 assert.deepEqual(globCaller('fast-glob').sync('vendor/braces/{index,package}.{js,json}',{cwd:path.resolve(__dirname,'..')}),['vendor/braces/index.js','vendor/braces/package.json']);
});
test('all public string routes reject deep brace, parenthesis and combined nesting',()=>{
 for(const input of [nested(101),nested(101,'paren'),nested(51,'mixed'),'{'.repeat(101),'('.repeat(101)])for(const method of ['parse','compile','expand','stringify','create'])assert.throws(()=>braces[method](input),/exceeds max depth/);
 assert.throws(()=>braces(nested(101)),/exceeds max depth/);assert.throws(()=>braces([nested(101)],{expand:true}),/exceeds max depth/);
});
test('direct AST recursion and cyclic child links fail at the bounded guard',()=>{
 for(const method of ['compile','expand','stringify'])for(const type of ['brace','paren'])assert.throws(()=>braces[method](ast(3000,type)),/exceeds max depth/);
 for(const method of ['compile','expand','stringify']){const node={type:'paren',nodes:[]};node.nodes.push(node);assert.throws(()=>braces[method]({type:'root',nodes:[node]}),/exceeds max depth/);}
});
test('expand bounds malformed parent ancestry without following a cycle forever',()=>{
 const code="const assert=require('node:assert/strict');const braces=require('./node_modules/braces');const child={type:'paren',nodes:[]};child.parent=child;assert.throws(()=>braces.expand({type:'root',nodes:[child]}),/Parent depth/);const child2={type:'paren',nodes:[{type:'paren',nodes:[]}]};const p={type:'paren',queue:[]};p.parent=p;child2.parent=p;assert.throws(()=>braces.expand({type:'root',nodes:[child2]}),/Parent depth/);";
 const result=spawnSync(process.execPath,['-e',code],{cwd:path.resolve(__dirname,'..'),timeout:3000,encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.error?.message||result.stderr);
});
test('100-level boundary, tighter limits and invalid limit clamping',()=>{
 for(const kind of ['brace','paren'])for(const method of ['parse','compile','expand','stringify'])assert.doesNotThrow(()=>braces[method](nested(100,kind)));
 for(const maxDepth of [1,1.5])for(const method of ['parse','compile','expand','stringify'])assert.throws(()=>braces[method](nested(2),{maxDepth}),/exceeds max depth/);
 for(const maxDepth of [101,Infinity,NaN,'Infinity',null])for(const method of ['parse','compile','expand','stringify'])assert.throws(()=>braces[method](nested(101),{maxDepth}),/exceeds max depth/);
});
test('normal ranges, alternatives, escaping and original quote/invalid-node contracts',()=>{
 assert.deepEqual(braces.expand('unit-{1..3}'),['unit-1','unit-2','unit-3']);assert.deepEqual(braces.expand('{a,{b,c}}'),['a','b','c']);assert.equal(braces.stringify(braces.parse('{a,b}')),'{a,b}');
 const value=String.raw`\{literal\}`;assert.equal(braces.stringify(braces.parse(value,{keepEscaping:true})),value);assert.equal(braces.stringify(braces.parse('{a}'),{escapeInvalid:true}),'{a}');
 assert.equal(braces.compile('"{a,b}'),'{a,b}');assert.deepEqual(braces.expand('"{a,b}'),['{a,b}']);assert.deepEqual(braces.expand('{a,b}"'),['a','b']);assert.equal(braces.compile('{a.b..c,d}'),'{a.b..c,d}');assert.deepEqual(braces.expand('{a.b..c,d}'),['{a.b..c,d}']);assert.doesNotThrow(()=>braces.parse('"'+'{'.repeat(150)+'"'));
});
