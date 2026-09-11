#!/usr/bin/env node
// OOXML -> renderer-neutral scene data. No slide coordinates live in the renderer.
import fs from 'node:fs';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const sha = b => createHash('sha256').update(b).digest('hex');
const decode = s => s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, k) =>
  k[0] === '#' ? String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : +k.slice(1)) : ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[k]);
export function xml(s) {
  const root = {name:'root', attrs:{}, children:[]}; const stack = [root];
  for (const t of s.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<[^>]+>|[^<]+/g) || []) {
    if (t.startsWith('<?') || t.startsWith('<!')) continue;
    if (t.startsWith('</')) { const n = stack.pop(); if (n.name !== t.slice(2,-1).trim()) throw Error('Mismatched XML tag'); }
    else if (t.startsWith('<')) {
      const name = t.match(/^<([^\s/>]+)/)[1]; const attrs = {};
      for (const m of t.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[m[1]] = decode(m[2] ?? m[3]);
      const n = {name, attrs, children:[]}; stack.at(-1).children.push(n); if (!t.endsWith('/>')) stack.push(n);
    } else stack.at(-1).children.push(decode(t));
  }
  if (stack.length !== 1) throw Error('Unclosed XML tag'); return root.children.find(x=>typeof x!=='string');
}
export const kids = (n, name) => (n?.children || []).filter(x => typeof x !== 'string' && (!name || x.name === name));
export const child = (n, name) => kids(n, name)[0];
export const find = (n, name) => n?.name === name ? n : kids(n).map(x => find(x,name)).find(Boolean);
export const all = (n, name) => [...(n?.name === name ? [n] : []), ...kids(n).flatMap(x => all(x,name))];
const val = (n, fallback) => n?.attrs?.val ?? fallback;
const plain = n => (n?.children || []).map(x => typeof x === 'string' ? x : plain(x)).join('');
const attrs = n => n?.attrs || {};
const num = (n, k, d=0) => +(n?.attrs?.[k] ?? d);

// Read standard ZIP entries with built-in zlib. Paths are never executed or unpacked blindly.
export function openPackage(source) {
  if (fs.statSync(source).isDirectory()) return name => fs.readFileSync(path.join(source,name));
  const b = fs.readFileSync(source); let end = b.length - 22;
  while (end >= Math.max(0,b.length-65557) && b.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw Error('PPTX ZIP directory missing');
  const entries = new Map(); let p = b.readUInt32LE(end+16);
  for (let i=0;i<b.readUInt16LE(end+10);i++) {
    if (b.readUInt32LE(p)!==0x02014b50) throw Error('Invalid ZIP directory');
    const name=b.subarray(p+46,p+46+b.readUInt16LE(p+28)).toString();
    entries.set(name,{method:b.readUInt16LE(p+10),size:b.readUInt32LE(p+20),offset:b.readUInt32LE(p+42)});
    p+=46+b.readUInt16LE(p+28)+b.readUInt16LE(p+30)+b.readUInt16LE(p+32);
  }
  return name => {
    const e=entries.get(name); if(!e) throw Error(`Missing OOXML part: ${name}`);
    const q=e.offset+30+b.readUInt16LE(e.offset+26)+b.readUInt16LE(e.offset+28); const data=b.subarray(q,q+e.size);
    if(e.method===0) return data; if(e.method===8) return inflateRawSync(data); throw Error(`Unsupported ZIP compression ${e.method}`);
  };
}

// DrawingML colour transforms operate on HSL luminance, not raw RGB channels.
// Picture shadows in this deck use <a:prstClr val="black"/>. Only the presets the
// house deck actually references; an unknown name stays undefined and warns.
const PRESET={black:'#000000',white:'#FFFFFF',gray:'#808080',grey:'#808080',red:'#FF0000',blue:'#0000FF',green:'#008000',yellow:'#FFFF00'};

export function colour(node, theme, map={}, placeholder) {
  if (!node) return undefined;
  const c = kids(node).find(x => /:(srgbClr|schemeClr|sysClr|prstClr)$/.test(x.name)) || node;
  let hex = c.name==='a:schemeClr' ? (c.attrs.val==='phClr' ? placeholder : theme[map[c.attrs.val] || c.attrs.val]) :
    c.name==='a:sysClr' ? '#'+c.attrs.lastClr : c.name==='a:srgbClr' ? '#'+c.attrs.val :
    c.name==='a:prstClr' ? (PRESET[c.attrs.val] || undefined) : undefined;
  if(!hex) return undefined;
  let rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255), hi=Math.max(...rgb),lo=Math.min(...rgb),l=(hi+lo)/2,h=0,s=0;
  if(hi!==lo){ const d=hi-lo;s=d/(1-Math.abs(2*l-1));h=(hi===rgb[0]?(rgb[1]-rgb[2])/d+(rgb[1]<rgb[2]?6:0):hi===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4)/6; }
  let alpha=1;
  for(const t of kids(c)){ const v=+t.attrs.val/100000;
    if(t.name==='a:lumMod') l*=v; if(t.name==='a:lumOff') l+=v;
    if(t.name==='a:alpha') alpha=v;
    if(t.name==='a:shade') l*=v; if(t.name==='a:tint') l=l*v+1-v;
    if(t.name==='a:satMod') s*=v;
  }
  l=Math.min(1,Math.max(0,l));s=Math.min(1,Math.max(0,s));
  const a=s*Math.min(l,1-l);const channel=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
  hex='#'+[channel(0),channel(8),channel(4)].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
  return alpha===1?hex:`${hex}${Math.round(alpha*255).toString(16).padStart(2,'0')}`;
}

export function extract(source, mediaDir) {
  const read=openPackage(source), cache=new Map(), hashes={};
  const doc=p=>{if(!cache.has(p)){const b=read(p);hashes[p]=sha(b);cache.set(p,xml(b.toString('utf8')));}return cache.get(p);};
  const rels=p=>{let r;try{r=doc(path.posix.join(path.posix.dirname(p),'_rels',path.posix.basename(p)+'.rels'));}catch{return {};}
    return Object.fromEntries(kids(r).map(n=>[n.attrs.Id,{type:n.attrs.Type.split('/').at(-1),target:n.attrs.TargetMode==='External'?null:path.posix.normalize(path.posix.join(path.posix.dirname(p),n.attrs.Target))}]));};
  const relation=(p,type)=>Object.values(rels(p)).find(r=>r.type===type)?.target;
  const presentation=doc('ppt/presentation.xml'), size=attrs(child(presentation,'p:sldSz'));
  const result={version:1,source:{name:path.basename(source),sha256:fs.statSync(source).isFile()?sha(fs.readFileSync(source)):null,parts:hashes},size:[+size.cx,+size.cy],slides:[],warnings:[]};
  const media=new Map(); fs.mkdirSync(mediaDir,{recursive:true});
  function asset(p){if(!p)return null;if(!media.has(p)){const bytes=read(p);let name=sha(bytes).slice(0,16)+path.posix.extname(p).toLowerCase();fs.writeFileSync(path.join(mediaDir,name),bytes);
    if(/\.tiff?$/i.test(p) && process.platform==='win32'){
      const input=path.resolve(mediaDir,name),output=input.replace(/\.tiff?$/i,'.png');
      // Native Windows image decoder; no npm/Python dependencies. Literal paths are passed as environment data.
      execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile($env:NEVRON_IMAGE_INPUT); try { $img.Save($env:NEVRON_IMAGE_OUTPUT, [System.Drawing.Imaging.ImageFormat]::Png) } finally { $img.Dispose() }"],{env:{...process.env,NEVRON_IMAGE_INPUT:input,NEVRON_IMAGE_OUTPUT:output}});
      name=path.basename(output);
    }
    // EMF/WMF are Windows metafiles. GDI+ draws them, so rasterising at 4x keeps
    // the line art crisp at slide scale instead of demanding a hand substitution.
    if(/\.(emf|wmf)$/i.test(p) && process.platform==='win32'){
      const input=path.resolve(mediaDir,name),output=input.replace(/\.(emf|wmf)$/i,'.png');
      try{
        execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
          "Add-Type -AssemblyName System.Drawing; $mf = New-Object System.Drawing.Imaging.Metafile($env:NEVRON_IMAGE_INPUT); try { $s = 4; $w = [int]($mf.Width * $s); $h = [int]($mf.Height * $s); $bmp = New-Object System.Drawing.Bitmap($w, $h); $g = [System.Drawing.Graphics]::FromImage($bmp); try { $g.Clear([System.Drawing.Color]::Transparent); $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias; $g.DrawImage($mf, (New-Object System.Drawing.Rectangle(0,0,$w,$h))) } finally { $g.Dispose() }; $bmp.Save($env:NEVRON_IMAGE_OUTPUT, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose() } finally { $mf.Dispose() }"],
          {env:{...process.env,NEVRON_IMAGE_INPUT:input,NEVRON_IMAGE_OUTPUT:output},stdio:'pipe'});
        if(fs.statSync(output).size>0)name=path.basename(output);
      }catch{/* left as .emf; the picture branch warns and asks for a substitution */}
    }
    media.set(p,name);}return media.get(p);}
  const slideIds=kids(child(presentation,'p:sldIdLst')); const pr=rels('ppt/presentation.xml');
  for(let index=0;index<slideIds.length;index++) {
    const sp=pr[slideIds[index].attrs['r:id']].target, slide=doc(sp),lp=relation(sp,'slideLayout'),layout=lp?doc(lp):null,mp=lp?relation(lp,'slideMaster'):null,master=mp?doc(mp):null;
    const tp=mp?relation(mp,'theme'):'ppt/theme/theme1.xml',themeDoc=doc(tp); const theme={};
    for(const c of kids(find(themeDoc,'a:clrScheme'))) theme[c.name.split(':')[1]]=colour(c,{});
    // Runs may name a theme slot ("+mn-lt") instead of a face. Keep the mapping so
    // the renderer resolves it instead of guessing a fallback family.
    const themeFonts={major:child(find(themeDoc,'a:majorFont'),'a:latin')?.attrs.typeface,minor:child(find(themeDoc,'a:minorFont'),'a:latin')?.attrs.typeface};
    const map={...attrs(child(master,'p:clrMap')),...attrs(find(layout,'a:overrideClrMapping')),...attrs(find(slide,'a:overrideClrMapping'))};
    const col=n=>colour(n,theme,map);
    function fill(n){if(child(n,'a:noFill'))return {type:'none'};
      const solid=child(n,'a:solidFill');if(solid)return {type:'solid',colour:col(solid)};
      const grad=child(n,'a:gradFill');if(grad)return {type:'gradient',angle:num(child(grad,'a:lin'),'ang')/60000,stops:all(grad,'a:gs').map(s=>[num(s,'pos')/100000,col(s)])};
      return null;
    }
    function styledFill(n){const own=fill(n);return own;}
    function bg(n){const b=find(n,'p:bg');if(!b)return null;const direct=fill(child(b,'p:bgPr'));if(direct)return direct;
      const ref=child(b,'p:bgRef');if(ref){const idx=num(ref,'idx')-1001;const style=kids(find(themeDoc,'a:bgFillStyleLst'))[idx];
        return {type:'solid',colour:colour(style,theme,map,col(ref))||col(ref)};}return null;}
    const scene={number:index+1,source:sp,layout:lp,master:mp,theme,themeFonts,background:bg(slide)||bg(layout)||bg(master),shapes:[]};
    const warn=(id,message)=>{result.warnings.push({slide:index+1,shape:id,message});};
    const placeholder=n=>find(n,'p:ph');
    const match=(n,root)=>{const p=placeholder(n);if(!p)return null;return kids(find(root,'p:spTree')).find(s=>{const q=placeholder(s);return q && (p.attrs.idx!==undefined?q.attrs.idx===p.attrs.idx:(q.attrs.type||'body')===(p.attrs.type||'body'));});};
    function rstyle(n){const o={...attrs(n)};const c=col(child(n,'a:solidFill'));if(c)o.colour=c;const font=child(n,'a:latin');if(font)o.font=font.attrs.typeface;return o;}
    function pstyle(n){const o={...attrs(n)};for(const k of ['lnSpc','spcBef','spcAft']){const s=kids(child(n,'a:'+k))[0];if(s)o[k]={unit:s.name.split(':')[1],value:+s.attrs.val};}
      // The bullet character belongs to the bullet font, not the text font:
      // "§" in Wingdings is a small filled square, not a section sign.
      if(child(n,'a:buNone'))o.bullet=null;else if(child(n,'a:buChar'))o.bullet={char:child(n,'a:buChar').attrs.char,font:child(n,'a:buFont')?.attrs.typeface||null};
      // PowerPoint colours the bullet from a:buClr, and only falls back to the
      // first run when that is absent. Without this the glyph inherits the
      // document default and goes black on a navy slide.
      const bc=col(child(n,'a:buClr'));if(bc)o.bulletColour=bc;
      return o;}
    function text(n, chain){const body=child(n,'p:txBody')||child(n,'a:txBody');if(!body)return null;
      const ph=placeholder(n),type=ph?.attrs.type||'body';const styleName=!ph?'otherStyle':/title/i.test(type)?'titleStyle':'bodyStyle';
      const defaults=find(presentation,'p:defaultTextStyle'),masterStyle=child(child(master,'p:txStyles'),'p:'+styleName);
      const bodyPr=Object.assign({},...chain.slice().reverse().map(s=>attrs(child(child(s,'p:txBody'),'a:bodyPr'))),attrs(child(body,'a:bodyPr')));
      const paragraphs=kids(body,'a:p').map(p=>{
        const pp=child(p,'a:pPr'),level=num(pp,'lvl')+1;
        const inherited=[child(defaults,'a:defPPr'),child(defaults,`a:lvl${level}pPr`),child(masterStyle,'a:defPPr'),child(masterStyle,`a:lvl${level}pPr`),
          ...chain.slice().reverse().map(s=>child(child(child(s,'p:txBody'),'a:lstStyle'),`a:lvl${level}pPr`)),child(child(body,'a:lstStyle'),`a:lvl${level}pPr`),pp];
        const ps=Object.assign({},...inherited.map(pstyle)),rs=Object.assign({},...inherited.map(x=>rstyle(child(x,'a:defRPr'))));
        const runs=kids(p).filter(r=>['a:r','a:br','a:fld'].includes(r.name)).map(r=>({text:r.name==='a:br'?'\n':plain(child(r,'a:t')),style:{...rs,...rstyle(child(r,'a:rPr'))}}));
        return {style:ps,runs,end:{...rs,...rstyle(child(p,'a:endParaRPr'))}};
      });return {body:bodyPr,paragraphs};
    }
    function transform(n){const off=child(n,'a:off'),ext=child(n,'a:ext');return {x:num(off,'x'),y:num(off,'y'),w:num(ext,'cx'),h:num(ext,'cy'),rotation:num(n,'rot')/60000,flipH:n?.attrs.flipH==='1',flipV:n?.attrs.flipV==='1'};}
    function shapes(root,owner,inherited=false){return kids(root).filter(n=>['p:sp','p:pic','p:cxnSp','p:graphicFrame','p:grpSp'].includes(n.name)).flatMap(n=>{
      if(inherited && placeholder(n))return [];
      if(placeholder(n)?.attrs.type==='sldNum')return [];
      const nv=find(n,'p:cNvPr'),id=nv?.attrs.id,kind=n.name.slice(2),l=match(n,layout),m=match(l||n,master),chain=[l,m].filter(Boolean);
      const props=child(n,'p:spPr')||child(n,'p:grpSpPr'); const xf=child(props,'a:xfrm')||child(n,'p:xfrm')||chain.map(s=>find(child(s,'p:spPr'),'a:xfrm')).find(Boolean);
      if(!xf){warn(id,'Missing transform');return [];}
      const o={id:inherited?owner+'#'+id:id,name:nv?.attrs.name,kind,box:transform(xf),source:owner,fill:styledFill(props)};
      if(kind==='grpSp'){o.childOrigin=[num(child(xf,'a:chOff'),'x'),num(child(xf,'a:chOff'),'y')];o.childSize=[num(child(xf,'a:chExt'),'cx'),num(child(xf,'a:chExt'),'cy')];o.children=shapes(n,owner);return [o];}
      const geom=child(props,'a:prstGeom');o.geometry=geom?.attrs.prst;
      if(child(props,'a:custGeom')){o.custom=child(props,'a:custGeom');warn(id,'Custom DrawingML path retained; renderer supports literal paths only');}
      if(geom)o.adjustments=Object.fromEntries(all(geom,'a:gd').map(g=>[g.attrs.name,g.attrs.fmla]));
      const ln=child(props,'a:ln');if(ln)o.line={...attrs(ln),fill:fill(ln),head:attrs(child(ln,'a:headEnd')),tail:attrs(child(ln,'a:tailEnd'))};
      const shdw=child(child(props,'a:effectLst'),'a:outerShdw');
      if(shdw)o.shadow={blur:num(shdw,'blurRad'),dist:num(shdw,'dist'),dir:num(shdw,'dir')/60000,colour:col(shdw)};
      const style=child(n,'p:style'); if(!o.fill){const ref=child(style,'a:fillRef'),f=kids(find(themeDoc,'a:fillStyleLst'))[num(ref,'idx')-1];if(f){o.fill=fill({children:[f]});if(o.fill?.type==='solid'&&!o.fill.colour)o.fill.colour=col(ref);}}
      if(!o.line){const ref=child(style,'a:lnRef'),ln=kids(find(themeDoc,'a:lnStyleLst'))[num(ref,'idx')-1];if(ln){o.line={...attrs(ln),fill:fill(ln)};if(o.line.fill?.type==='solid'&&!o.line.fill.colour)o.line.fill.colour=col(ref);}}
      o.text=text(n,chain);
      if(kind==='pic'){
        const bf=child(n,'p:blipFill'),rr=rels(owner),primary=rr[child(bf,'a:blip')?.attrs['r:embed']]?.target,alternative=rr[find(bf,'asvg:svgBlip')?.attrs['r:embed']]?.target;
        // TIFF and EMF/WMF are converted on Windows by asset(); a metafile that
        // GDI+ refuses comes back with its original extension and still warns.
        const supported=p=>p&&(/\.(png|jpe?g|gif|svg)$/i.test(p)||(process.platform==='win32'&&/\.(tiff?|emf|wmf)$/i.test(p)));
        const chosen=supported(primary)?primary:supported(alternative)?alternative:null;
        const file=chosen?asset(chosen):null;
        // a:alphaModFix scales the picture's opacity. House 22 leans on it to
        // grey out black icons; ignoring it renders them solid black.
        const amt=find(bf,'a:alphaModFix')?.attrs.amt;
        o.image={primary,alternative,asset:file,crop:attrs(child(bf,'a:srcRect')),...(amt?{alpha:+amt/100000}:{})};
        if(!file||/\.(emf|wmf|tiff?)$/i.test(file))warn(id,`Unsupported picture: ${primary}; needs an explicit asset substitution`);
      }
      if(kind==='graphicFrame'){
        const chart=find(n,'c:chart');if(chart){const cp=rels(owner)[chart.attrs['r:id']]?.target,cd=doc(cp),donut=find(cd,'c:doughnutChart');
          if(donut){o.chart={source:cp,type:'doughnut',hole:+val(child(donut,'c:holeSize'),50),angle:+val(child(donut,'c:firstSliceAng'),0),series:kids(donut,'c:ser').map(s=>({values:all(child(s,'c:val'),'c:pt').map(p=>({index:num(p,'idx'),value:+plain(child(p,'c:v'))})),fills:kids(s,'c:dPt').map(p=>({index:+val(child(p,'c:idx')),fill:fill(child(p,'c:spPr'))}))}))};}
          else warn(id,`Unsupported chart in ${cp}`);
        }
        const table=find(n,'a:tbl');if(table){o.table={columns:kids(child(table,'a:tblGrid'),'a:gridCol').map(c=>num(c,'w')),rows:kids(table,'a:tr').map(r=>({height:num(r,'h'),cells:kids(r,'a:tc').map(c=>({text:text(c,[]),fill:fill(child(c,'a:tcPr'))}))}))};}
      }
      return [o];
    });}
    if(slide.attrs.showMasterSp!=='0' && layout?.attrs.showMasterSp!=='0')scene.shapes.push(...shapes(find(master,'p:spTree'),mp,true));
    if(slide.attrs.showMasterSp!=='0')scene.shapes.push(...shapes(find(layout,'p:spTree'),lp,true));
    scene.shapes.push(...shapes(find(slide,'p:spTree'),sp));result.slides.push(scene);
  }
  result.media=Object.fromEntries(media);return result;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [source,out,media]=process.argv.slice(2);if(!media)throw Error('Usage: node extract.mjs source.pptx house.json media-directory');
  const data=extract(source,path.resolve(media));fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(data));
  console.log(`Extracted ${data.slides.length} slides, ${Object.keys(data.media).length} media files; ${data.warnings.length} explicit warnings. ${out}`);
}
