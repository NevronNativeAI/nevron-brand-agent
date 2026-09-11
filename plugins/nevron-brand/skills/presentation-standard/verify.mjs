#!/usr/bin/env node
// Deterministic 1600x900 Chrome captures, side-by-side gallery, runtime diagnostics.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build,chrome,layouts} from './build.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const [mediaRoot,referenceRoot,output]=process.argv.slice(2);
if(!output)throw Error('Usage: node verify.mjs media-directory reference-png-directory output-directory');
const out=path.resolve(output);fs.mkdirSync(out,{recursive:true});
const catalogue=Object.entries(layouts).sort((a,b)=>a[1]-b[1]);
const house=JSON.parse(fs.readFileSync(path.join(here,'reference/house.json'),'utf8'));
if(catalogue.length!==house.slides.length||new Set(catalogue.map(([,n])=>n)).size!==house.slides.length||house.slides.some(s=>!catalogue.some(([,n])=>n===s.number)))throw Error('Catalogue must name every house slide exactly once');
const fontMode=process.env.NEVRON_FONT_MODE||'open-sans';
const results=[];
for(const [layout,number] of catalogue){
  const name='house-'+String(number).padStart(2,'0'),json=path.join(out,'capture.json');
  fs.writeFileSync(json,JSON.stringify({title:`House slide ${number}`,mediaRoot:path.resolve(mediaRoot),fontDir:process.env.NEVRON_FONT_DIR,slides:[{layout}]}));
  build(json,out,{reference:true,fontMode});
  const html=path.join(out,name+'.html');let page=fs.readFileSync(path.join(out,'index.html'),'utf8');
  // Read-only layout diagnostics: exclude empty text and source objects wholly outside the stage.
  page=page.replace('</script>',`window.deckReady.then(()=>{
    const errors=[];for(const t of document.querySelectorAll('.text')){const s=t.closest('.shape'),b=s.getBoundingClientRect(),c=t.querySelector('.text-content').getBoundingClientRect();if(!t.textContent.trim()||b.right<0||b.bottom<0||b.left>innerWidth||b.top>innerHeight)continue;
    const p=getComputedStyle(t);if(c.bottom>b.bottom-parseFloat(p.paddingBottom)*innerWidth/960+2)errors.push({shape:s.dataset.shape,kind:'vertical-text-overflow'});}
    for(const im of document.images)if(!im.complete||!im.naturalWidth)errors.push({kind:'missing-image',src:im.getAttribute('src')});
    const report=document.createElement('script');report.type='application/json';report.id='diagnostics';report.textContent=JSON.stringify(errors);document.body.append(report);
  });</script>`);
  fs.writeFileSync(html,page);const png=path.join(out,name+'.png');
  chrome(html,['--window-size=1600,900',`--screenshot=${png}`]);
  if(!fs.existsSync(png))throw Error(`Screenshot missing: ${png}`);
  const dom=chrome(html,['--window-size=1600,900','--dump-dom']).toString();
  const diagnostics=JSON.parse(dom.match(/id="diagnostics">([^<]*)<\/script>/)?.[1]||'[]');
  const ref=path.resolve(referenceRoot,`slide${String(number).padStart(2,'0')}.png`);
  fs.copyFileSync(ref,path.join(out,`reference-${number}.png`));
  results.push({layout,houseSlide:number,capture:name+'.png',reference:`reference-${number}.png`,diagnostics});console.log(`${name}: captured; ${diagnostics.length} diagnostics`);
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>House-slide comparison</title><style>body{margin:24px;background:#ddd;font:16px sans-serif}article{margin-bottom:32px}figure{margin:0}main{display:grid;grid-template-columns:1fr 1fr;gap:8px}img{display:block;width:100%}summary{cursor:pointer}pre{white-space:pre-wrap}</style><h1>House-slide comparison</h1><p>Left: exported house PNG (1280×720). Right: extracted HTML rendered at 1600×900. Font mode: ${fontMode}. No visual-match pass is inferred from these captures.</p>${results.map(r=>`<article><h2>House ${r.houseSlide}: ${r.layout}</h2><main><figure><figcaption>PowerPoint export</figcaption><img src="${r.reference}"></figure><figure><figcaption>Extracted HTML · ${fontMode}</figcaption><a href="${r.capture}"><img src="${r.capture}"></a></figure></main><details><summary>${r.diagnostics.length} text/image diagnostics</summary><pre>${JSON.stringify(r.diagnostics,null,2)}</pre></details></article>`).join('')}</html>`);
console.log(`Gallery: ${path.join(out,'index.html')}`);
