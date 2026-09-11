#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {sha} from './extract.mjs';
import {renderScene,escape} from './render.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export const flatten=shapes=>shapes.flatMap(s=>[s,...flatten(s.children||[])]);
const clone=x=>structuredClone(x);
// One name per source slide, in house-deck order. Sequences retain the reveals.
export const layouts={
  notice:1,'cover-photo':2,cover:3,'cover-wave':4,
  'donut-step-1':5,'donut-step-2':6,'donut-step-3':7,
  'donut-step-4':8,'donut-step-5':9,'donut-step-6':10,
  'panel-step-1':11,'panel-step-2':12,'panel-step-3':13,'panel-step-4':14,
  section:15,'phone-hero':16,'text-phone-cloud':17,'text-browser-screen':18,
  bullets:19,devices:20,'integration-diagram':21,
  'quadrant-matrix':22,'quadrant-callouts':23,'section-subtitle':24,split:25,
  'bullets-screen-short':26,'bullets-screen-tall':27,'bullets-screen-poster':28,
  'sentiment-grid':29,'section-subtitle-variant':30,
  'bullets-phone':31,'bullets-phone-dense':32,'bullets-two-phones':33,
  statement:34,'photo-callout-step-1':35,'photo-callout-step-2':36,
  'steps-3':37,'cards-3-light':38,
  'proposal-qr':39,'proposal-tray':40,'proposal-card':41,
  'proposal-envelope-grid':42,'proposal-origami':43,'section-subtitle-high':44,
  stats:45,'photo-panels-3':46,'photo-cards-6':47,'text-circular-diagram':48,
  'bullets-system-diagram':49,'cards-3':50,'cards-8':51,
  'product-hero-room':52,'product-hero-screens':53,'closing-frame':54,closing:55
};
const sequences={'donut-build':[5,6,7,8,9,10],'panel-build':[11,12,13,14],'photo-callout-build':[35,36]};
function replaceText(shape,value){
  if(!shape.text)throw Error(`Shape ${shape.id} has no text`);
  if(Array.isArray(value)){
    shape.text.paragraphs=value.map((v,i)=>{
      const old=shape.text.paragraphs[Math.min(i,shape.text.paragraphs.length-1)],p=clone(old);
      if(typeof v==='string')p.runs=[{text:v,style:clone(old.runs.find(r=>r.text.trim())?.style||old.end)}];
      else if(v&&Array.isArray(v.runs))p.runs=v.runs.map((text,j)=>{if(j>=old.runs.length)throw Error(`Too many run overrides in ${shape.id}`);return {...clone(old.runs[j]),text};});
      else throw Error('Text must be a string or paragraph array');return p;
    });
  }else if(typeof value==='string'){
    const style=clone(shape.text.paragraphs[0].runs.find(r=>r.text.trim())?.style||shape.text.paragraphs[0].end);
    shape.text.paragraphs=[{...clone(shape.text.paragraphs[0]),runs:[{text:value,style}]}];
  }else throw Error('Text override must be a string or array');
}
function patchScene(scene,spec){
  const byId=new Map(flatten(scene.shapes).map(s=>[s.id,s]));
  for(const [id,value]of Object.entries(spec.text||{})){const s=byId.get(id);if(!s)throw Error(`Unknown text shape ${id} on slide ${scene.number}`);replaceText(s,value);}
  for(const [id,value]of Object.entries(spec.images||{})){const s=byId.get(id);if(!s?.image)throw Error(`Unknown image shape ${id} on slide ${scene.number}`);s.image={file:typeof value==='string'?value:value.src,crop:typeof value==='object'?value.crop||{}:{}};s.alt=typeof value==='object'?value.alt:undefined;}
  for(const [id,values]of Object.entries(spec.charts||{})){const s=byId.get(id);if(!s?.chart)throw Error(`Unknown chart shape ${id}`);if(values.length!==s.chart.series[0].values.length)throw Error('Preserve the source chart slice count');s.chart.series[0].values=values.map((value,index)=>({index,value}));}
  const hide=new Set(spec.hide||[]);for(const id of hide)if(!byId.has(String(id)))throw Error(`Unknown hidden shape ${id}`);
  const prune=ss=>ss.filter(s=>!hide.has(s.id)).map(s=>{if(s.children)s.children=prune(s.children);return s;});scene.shapes=prune(scene.shapes);scene.label=spec.label;return scene;
}
export function compose(deck,house){
  if(!Array.isArray(deck.slides)||!deck.slides.length)throw Error('deck.slides must be a nonempty array');
  const scenes=[];
  for(const spec of deck.slides){
    const numbers=sequences[spec.layout]||[spec.houseSlide||layouts[spec.layout]];
    if(!numbers[0])throw Error(`Unknown layout ${spec.layout}`);
    for(const [step,number]of numbers.entries()){
      const source=house.slides.find(s=>s.number===number);if(!source)throw Error(`Unknown house slide ${number}`);
      const scene=patchScene(clone(source),{...spec,...spec.steps?.[step]});
      for(const [field,number,id]of [['section',51,'20'],['source',6,'3']])if(spec[field]){
        const chrome=clone(house.slides.find(s=>s.number===number).shapes.find(s=>s.id===id));
        scene.shapes=scene.shapes.filter(s=>!(s.box.x===chrome.box.x&&s.box.y===chrome.box.y));
        chrome.id='chrome-'+field;replaceText(chrome,spec[field]);
        if(scene.background?.colour===scene.theme.lt1)for(const p of chrome.text.paragraphs)for(const r of p.runs)r.style.colour=scene.theme.dk1;
        scene.shapes.push(chrome);
      }
      scenes.push(scene);
    }
  }return scenes;
}
export function chromePath(){
  const candidates=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'];
  const found=candidates.find(p=>p&&fs.existsSync(p));if(!found)throw Error('Chrome not found. Set CHROME_PATH.');return found;
}
export function chrome(html,args){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nevron-deck-chrome-'));
  return execFileSync(chromePath(),['--headless','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--allow-file-access-from-files','--hide-scrollbars','--run-all-compositor-stages-before-draw','--virtual-time-budget=2500',...JSON.parse(process.env.NEVRON_CHROME_ARGS||'[]'),...args,pathToFileURL(path.resolve(html)).href],{stdio:'pipe',timeout:60000});
}
export function build(deckFile,outDir,{pdf=false,reference=false,fontMode='open-sans'}={}){
  deckFile=path.resolve(deckFile);outDir=path.resolve(outDir);const dir=path.dirname(deckFile),deck=JSON.parse(fs.readFileSync(deckFile,'utf8').replace(/^\uFEFF/,''));
  const house=JSON.parse(fs.readFileSync(path.resolve(dir,deck.houseData||path.join(here,'reference/house.json')),'utf8'));
  const mediaDir=path.resolve(dir,deck.mediaRoot||'media'),scenes=compose(deck,house);
  fs.mkdirSync(path.join(outDir,'media'),{recursive:true});const copied=new Map(),warnings=[];
  const copy=file=>{file=path.resolve(file);if(!fs.existsSync(file))throw Error(`Missing asset ${file}`);if(!copied.has(file)){const bytes=fs.readFileSync(file),name=sha(bytes).slice(0,16)+path.extname(file);fs.writeFileSync(path.join(outDir,'media',name),bytes);copied.set(file,'media/'+name);}return copied.get(file);};
  // The cover frames extract faithfully from their metafiles, so a brand frame is
  // now a deliberate choice for a new deck rather than a stand-in. Naming
  // deck.frame swaps the pattern (guidelines 2.4.5); omitting it keeps the house art.
  const COVER_FRAMES=['ppt/media/image12.emf','ppt/media/image7.emf'];
  const frame=deck.frame?path.resolve(here,'../../assets/frames',deck.frame):null;
  const imageURL=(im)=>{
    if(im.file)return copy(path.resolve(dir,im.file));
    if(frame&&COVER_FRAMES.includes(im.primary))return copy(frame);
    const sub=deck.substitutions?.[im.primary];if(sub)return copy(path.resolve(dir,sub));
    if(im.asset)return copy(path.join(mediaDir,im.asset));return null;
  };
  const slides=scenes.map(scene=>renderScene(scene,{size:house.size,fontMode,imageURL,strict:!reference})).join('\n');
  for(const scene of scenes)for(const shape of flatten(scene.shapes))if(shape.chart)warnings.push(`House ${scene.number}: chart plot area uses automatic-layout fallback; OOXML has no manual plot bounds.`);
  if(!reference&&scenes.some(s=>flatten(s.shapes).some(s=>s.text?.paragraphs.some(p=>p.runs.some(r=>/lorem|ipsum/i.test(r.text))))))throw Error('Replace the house placeholder copy before building an authored deck');
  let fonts='';if(deck.fontDir){const fd=path.resolve(dir,deck.fontDir);for(const [suffix,weight]of [['Light',300],['Regular',400],['SemiBold',600],['Bold',700],['ExtraBold',800]]){const p=path.join(fd,`OpenSans-${suffix}.ttf`);fonts+=`@font-face{font-family:'Open Sans';font-weight:${weight};src:url('${copy(p)}') format('truetype');font-display:block;}`;}}
  const [w,h]=house.size.map(v=>v/12700),css=fs.readFileSync(path.join(here,'styles.css'),'utf8')+'\n'+fs.readFileSync(path.join(here,'ui.css'),'utf8');
  // Verification captures are single frozen slides, not a presentation: the
  // navigation chrome would sit in every comparison screenshot.
  const ui=reference?'':`<nav class="deck-ui" aria-label="Deck navigation"><button class="ui-btn" type="button" data-act="prev" title="Previous slide (left arrow)" aria-label="Previous slide">&#8249;</button><span class="ui-count"><b id="ui-cur">1</b>&#8239;/&#8239;${scenes.length}</span><button class="ui-btn" type="button" data-act="next" title="Next slide (right arrow)" aria-label="Next slide">&#8250;</button><button class="ui-btn" type="button" data-act="grid" title="Overview (O)" aria-label="Slide overview" aria-pressed="false">&#9638;</button><button class="ui-btn" type="button" data-act="full" title="Fullscreen (F)" aria-label="Fullscreen">&#10530;</button></nav><div class="deck-progress"><i id="ui-bar"></i></div><div class="deck-grid" id="deck-grid" hidden></div><div class="deck-help" id="deck-help" hidden><dl><h2>Keyboard</h2><dt>&#8592; &#8594;</dt><dd>Previous / next slide</dd><dt>O</dt><dd>Overview of every slide</dd><dt>F</dt><dd>Fullscreen</dd><dt>1&#8230;9 &#8629;</dt><dd>Jump to a slide number</dd><dt>Home End</dt><dd>First / last slide</dd><dt>Esc</dt><dd>Close overview or this panel</dd><dt>?</dt><dd>Show or hide this panel</dd></dl></div>`;
  const script=`const slides=[...document.querySelectorAll('.slide')],stage=document.querySelector('.stage');let current=0;
function show(i){current=Math.max(0,Math.min(slides.length-1,i));slides.forEach((s,j)=>s.classList.toggle('active',j===current));location.hash=String(current+1);}
function resize(){stage.style.transform='translate(-50%,-50%) scale('+Math.min(innerWidth/${w},innerHeight/${h})+')';}addEventListener('resize',resize);
addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(current+1);}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(current-1);}if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1);});
addEventListener('hashchange',()=>{const n=Number(location.hash.slice(1));if(Number.isInteger(n)&&n>0&&n<=slides.length)show(n-1);});show(Number(location.hash.slice(1)||1)-1);resize();
window.deckReady=document.fonts.ready.then(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));document.documentElement.dataset.ready='true';return true;});`+(reference?'':'\n'+fs.readFileSync(path.join(here,'ui.js'),'utf8'));
  fs.writeFileSync(path.join(outDir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(deck.title||'Nevron presentation')}</title><style>${fonts}\n${css}\n@page{size:${w}pt ${h}pt;margin:0}</style><body><main class="stage" style="width:${w}px;height:${h}px">${slides}</main>${ui}<script>${script}</script></body></html>`);
  const manifest={source:house.source.sha256,slides:scenes.map(s=>({houseSlide:s.number,label:s.label,shapes:flatten(s.shapes).map(s=>({id:s.id,source:s.source,box:s.box}))})),fontMode,warnings:[...new Set(warnings)],assets:copied.size};
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2));
  if(pdf){const target=path.join(outDir,'deck.pdf');chrome(path.join(outDir,'index.html'),[`--print-to-pdf=${target}`,'--no-pdf-header-footer']);if(!fs.existsSync(target)||fs.statSync(target).size<1000)throw Error('Chrome did not produce a PDF');}
  return {outDir,slides:scenes.length,warnings:manifest.warnings};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),flags=args.filter(a=>a.startsWith('--')),pos=args.filter(a=>!a.startsWith('--'));
  if(args[0]==='--inspect'){
    const number=layouts[args[1]]||Number(args[1]),house=JSON.parse(fs.readFileSync(path.join(here,'reference/house.json'),'utf8'));
    const s=house.slides.find(s=>s.number===number);if(!s)throw Error('Supply a layout name or house slide number');
    console.log(JSON.stringify({number,slots:flatten(s.shapes).filter(s=>s.text||s.image||s.chart).map(s=>({id:s.id,text:s.text?.paragraphs.map(p=>p.runs.map(r=>r.text).join('')),image:s.image?.primary,chart:s.chart?.series.map(s=>s.values)}))},null,2));process.exit(0);
  }
  if(!pos[0]){console.log('Usage: node build.mjs deck.json [output-dir] [--pdf] [--reference] [--source-fonts]');process.exit(1);}
  try{console.log(JSON.stringify(build(pos[0],pos[1]||path.join(path.dirname(pos[0]),'out'),{pdf:flags.includes('--pdf'),reference:flags.includes('--reference'),fontMode:flags.includes('--source-fonts')?'source':'open-sans'}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
