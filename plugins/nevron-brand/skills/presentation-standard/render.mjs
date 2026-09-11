// Generic scene renderer: geometry and type sizes come from the extractor.
export const escape = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(Number(x).toFixed(6));
const emu=x=>n((+x||0)/12700); // stage pixels are typographic points
const cssFill=f=>!f||f.type==='none'?'transparent':f.type==='solid'?f.colour:`linear-gradient(${90+f.angle}deg,${f.stops.map(([p,c])=>`${c} ${p*100}%`).join(',')})`;
// The slide fill sits on PowerPoint's white canvas. The house pale blue is
// #CCECFF at 50% alpha, so letting it blend with whatever is behind the element
// in the browser turned twelve slides grey. Layer it over an explicit white.
const slideFill=f=>{if(!f||f.type==='none')return '#fff';const paint=cssFill(f);
  return (f.type==='solid'?`linear-gradient(${paint},${paint})`:paint)+',#fff';};
const spacing=(s,base)=>s?(s.unit==='spcPts'?s.value/100:s.value/100000*base):0;
// Wingdings and Symbol bullets are stored as the codepoint the *bullet font*
// draws, not as the character it looks like. Rendered in a text font, "§" is
// literally a section sign; in Wingdings it is a small filled square.
const BULLET_FONTS=/^(Wingdings|Webdings|Symbol)/i;
const WINGDINGS={'§':'▪','n':'■','l':'●','¡':'●','¨':'▫','u':'❑','v':'❖','Ø':'➢','ü':'✔','þ':'☐'};
function bulletGlyph(bullet){
  const {char,font}=typeof bullet==='string'?{char:bullet,font:null}:bullet;
  return font&&BULLET_FONTS.test(font)?(WINGDINGS[char]??char):char;
}
function styleRun(s,mode,themeFonts){
  // "+mj-lt"/"+mn-lt" name a theme slot; resolve it rather than falling back to
  // a family the deck never asked for. Source mode needs the face installed.
  const slot=s.font?.startsWith('+')?(s.font.startsWith('+mj')?themeFonts?.major:themeFonts?.minor):null;
  const face=mode==='source'?(slot||s.font||'Open Sans'):'Open Sans';
  const weight=s.b==='1'?700:/Black|Heavy/i.test(s.font)?900:/ExtraBold/i.test(s.font)?800:/SemiBold/i.test(s.font)?600:/Light/i.test(s.font)?300:400;
  return `font-family:'${escape(face)}',sans-serif;font-size:${(+s.sz||1800)/100}px;font-weight:${weight};font-style:${s.i==='1'?'italic':'normal'};color:${s.colour||'inherit'};letter-spacing:${(+s.spc||0)/100}px;${s.u&&s.u!=='none'?'text-decoration:underline;':''}`;
}
function textHTML(text,mode,themeFonts){
  const b=text.body,inset=[b.tIns??45720,b.rIns??91440,b.bIns??45720,b.lIns??91440].map(emu);
  const content=text.paragraphs.map(p=>{
    const visible=p.runs.filter(r=>r.text!=='\n');
    const size=(visible.length?Math.max(...visible.map(r=>+r.style.sz||1800)):(+p.end.sz||1800))/100;
    // PowerPoint single spacing is the font's own line height, not the browser's
    // "normal". Office lays out spcPct against a 1.2x em box, so 100% is 1.2 and
    // an absent lnSpc is 100%. Using "normal" made every block too loose.
    const ps=p.style,line=ps.lnSpc?(ps.lnSpc.unit==='spcPct'?ps.lnSpc.value/100000*1.2:ps.lnSpc.value/100+'px'):1.2;
    const runs=p.runs.length?p.runs:[{text:'\u00a0',style:p.end}];
    const hasText=p.runs.some(r=>r.text!=='\n'&&r.text.trim()); // spacer paragraphs carry no bullet
    return `<p style="font-size:${size}px;line-height:${line};text-align:${({ctr:'center',r:'right',just:'justify'})[ps.algn]||'left'};margin:${spacing(ps.spcBef,size)}px 0 ${spacing(ps.spcAft,size)}px ${emu(ps.marL)}px;text-indent:${emu(ps.indent)}px">${ps.bullet&&hasText?`<span class="bullet" style="color:${ps.bulletColour||visible[0]?.style?.colour||'inherit'}">${escape(bulletGlyph(ps.bullet))}</span>`:''}${runs.map(r=>r.text==='\n'?'<br>':`<span style="${styleRun(r.style,mode,themeFonts)}">${escape(r.text).replace(/\n/g,'<br>')}</span>`).join('')}</p>`;
  }).join('');
  return `<div class="text" style="padding:${inset.map(x=>x+'px').join(' ')};justify-content:${({ctr:'center',b:'flex-end'})[b.anchor]||'flex-start'};white-space:${b.wrap==='none'?'pre':'pre-wrap'}"><div class="text-content">${content}</div></div>`;
}
function geometry(s,w,h,uid){
  const f=s.fill,line=s.line;let defs='',paint=f?.type==='solid'?f.colour:'none';
  if(f?.type==='gradient'){defs=`<linearGradient id="g${uid}" gradientTransform="rotate(${f.angle},.5,.5)">${f.stops.map(([p,c])=>`<stop offset="${p}" stop-color="${c}"/>`).join('')}</linearGradient>`;paint=`url(#g${uid})`;}
  const stroke=line?.fill?.type==='solid'?line.fill.colour:'none',sw=emu(line?.w??12700);
  const a=(key,fallback)=>{const v=s.adjustments?.[key]?.match(/^val (-?[\d.]+)$/);return v?+v[1]/100000:fallback;};
  let shape='';const polygon=pts=>`<polygon points="${pts.map(p=>p.map(n).join(',')).join(' ')}"/>`;
  switch(s.geometry||'rect'){
    case 'rect':case 'roundRect':shape=`<rect width="${w}" height="${h}"/>`;break;
    case 'ellipse':shape=`<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}"/>`;break;
    case 'line':case 'straightConnector1':shape=`<path d="M0 0 L${w} ${h}"/>`;break;
    case 'triangle':shape=polygon([[w*a('adj',.5),0],[w,h],[0,h]]);break;
    case 'star5':shape=polygon(Array.from({length:10},(_,i)=>{const angle=(-90+i*36)*Math.PI/180,rad=i%2?a('adj',.19098)*2:1;return [w/2+Math.cos(angle)*w/2*rad,h/2+Math.sin(angle)*h/2*rad];}));break;
    case 'downArrow':{const half=w*a('adj1',.5)/2,tip=Math.min(w,h)*a('adj2',.5);shape=polygon([[w/2-half,0],[w/2+half,0],[w/2+half,h-tip],[w,h-tip],[w/2,h],[0,h-tip],[w/2-half,h-tip]]);break;}
    case 'chevron':{const q=Math.min(w,h)*a('adj',.5);shape=polygon([[0,0],[w-q,0],[w,h/2],[w-q,h],[0,h],[q,h/2]]);break;}
    case 'corner':{const t=Math.min(w,h)*a('adj1',.5);shape=polygon([[0,0],[t,0],[t,h-t],[w,h-t],[w,h],[0,h]]);break;}
    case 'arc':{const start=a('adj1',162),end=a('adj2',0),p=v=>[w/2+w/2*Math.cos(v*Math.PI/108),h/2+h/2*Math.sin(v*Math.PI/108)];
      // PowerPoint sweeps clockwise from adj1 to adj2, and 216 units is a full
      // turn here. Pinning large-arc-flag to 1 drew every quarter arc as its
      // three-quarter complement, which is why house 39 swept the wrong way.
      const large=((((end-start)%216)+216)%216)>108?1:0;
      shape=`<path d="M${p(start)} A${w/2} ${h/2} 0 ${large} 1 ${p(end)}" fill="none"/>`;break;}
    default:throw Error(`Unsupported geometry ${s.geometry}, shape ${s.id}`);
  }
  if(s.custom)throw Error(`Custom geometry needs a reviewed image slot: ${s.id}`);
  const markers=[];
  for(const [end,kind]of [['start',line?.head],['end',line?.tail]])if(kind?.type&&kind.type!=='none'){
    defs+=`<marker id="m${uid}${end}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0 0L6 3L0 6Z" fill="${stroke}"/></marker>`;markers.push(`marker-${end}="url(#m${uid}${end})"`);
  }
  return `<svg class="geometry" width="${w||1}" height="${h||1}" overflow="visible"><defs>${defs}</defs><g fill="${paint}" stroke="${stroke}" stroke-width="${sw}" ${markers.join(' ')}>${shape}</g></svg>`;
}
function chartHTML(chart,w,h){
  // House charts omit manual plot bounds. Office auto-layout is not encoded in XML.
  // Explicit fallback, reported by build.mjs; never represented as extracted geometry.
  const outer=Math.min(w,h)/2-12,inner=outer*chart.hole/100,r=(outer+inner)/2,stroke=outer-inner;
  let rings='';for(const series of chart.series){const total=series.values.reduce((s,v)=>s+v.value,0);let offset=chart.angle/360;
    if(!Number.isFinite(total)||total<=0||series.values.some(v=>v.value<0))throw Error('Chart values must be nonnegative, with positive total');
    for(const v of series.values){const portion=v.value/total,colour=series.fills.find(f=>f.index===v.index)?.fill?.colour;if(!colour)throw Error(`Missing chart slice fill ${v.index}`);
      rings+=`<circle cx="${w/2}" cy="${h/2}" r="${r}" fill="none" stroke="${colour}" stroke-width="${stroke}" pathLength="1" stroke-dasharray="${portion} ${1-portion}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${w/2} ${h/2})"/>`;offset+=portion;}
  }return `<svg class="geometry" width="${w}" height="${h}" role="img" aria-label="${escape(chart.series.flatMap(s=>s.values.map(v=>v.value)).join(', '))}">${rings}</svg>`;
}
export function renderScene(scene,{size,fontMode='open-sans',imageURL,strict=true}){
  const render=(s,index)=>{
    const b=s.box,w=emu(b.w),h=emu(b.h),uid=scene.number+'-'+index+'-'+s.id.replace(/[^\w]/g,'');
    // drop-shadow follows the drawn alpha, so it works for cut-out pictures and
    // preset geometry alike, where box-shadow would only trace the bounding box.
    const sh=s.shadow,rad=sh?sh.dir*Math.PI/180:0;
    const shadow=sh?`filter:drop-shadow(${n(emu(sh.dist)*Math.cos(rad))}px ${n(emu(sh.dist)*Math.sin(rad))}px ${n(emu(sh.blur)/2)}px ${sh.colour});`:'';
    const style=`left:${emu(b.x)}px;top:${emu(b.y)}px;width:${w}px;height:${h}px;transform:rotate(${b.rotation}deg) scale(${b.flipH?-1:1},${b.flipV?-1:1});${shadow}`;
    let content='';
    if(s.kind==='grpSp'){
      const [cw,ch]=s.childSize,[cx,cy]=s.childOrigin;if(!cw||!ch)throw Error(`Invalid group scale ${s.id}`);
      // The child offset goes into left/top, not into the transform. With
      // transform-origin 0 0, scale(s)·translate(t) puts a child at s·(p+t);
      // left:s·t with transform:scale(s) gives s·t + s·p — identical on screen.
      // The difference is that a translate is paint-only, so the children kept
      // their untransformed layout position, e.g. 1428px inside a 960px slide.
      // Chrome's print fitter measures that layout extent and shrank every page
      // to ~67% to make it fit. Expressing the offset as layout removes it.
      const gx=b.w/cw,gy=b.h/ch;
      content=`<div class="group" style="left:${n(-emu(cx)*gx)}px;top:${n(-emu(cy)*gy)}px;transform:scale(${gx},${gy})">${s.children.map(render).join('')}</div>`;
    }else if(s.image){const url=imageURL(s.image,s);
      if(!url){if(strict)throw Error(`Image substitution required: slide ${scene.number}, shape ${s.id}, ${s.image.primary}`);content=`<div class="missing">IMAGE REQUIRED<br>${escape(s.image.primary)}</div>`;}
      else{const c=s.image.crop||{},l=(+c.l||0)/100000,r=(+c.r||0)/100000,t=(+c.t||0)/100000,bt=(+c.b||0)/100000;
        const alpha=s.image.alpha!==undefined&&s.image.alpha<1?`opacity:${s.image.alpha};`:'';
        content=`<div class="picture"><img alt="${escape(s.alt||s.name)}" src="${escape(url)}" style="${alpha}width:${100/(1-l-r)}%;height:${100/(1-t-bt)}%;left:${-100*l/(1-l-r)}%;top:${-100*t/(1-t-bt)}%"></div>`;}
    }else if(s.chart)content=chartHTML(s.chart,w,h);
    else if(s.table)content=`<table style="width:${w}px;height:${h}px"><colgroup>${s.table.columns.map(c=>`<col style="width:${emu(c)}px">`).join('')}</colgroup>${s.table.rows.map(row=>`<tr style="height:${emu(row.height)}px">${row.cells.map(cell=>`<td style="background:${cssFill(cell.fill)}">${textHTML(cell.text,fontMode,scene.themeFonts)}</td>`).join('')}</tr>`).join('')}</table>`;
    else{content=geometry(s,w,h,uid);if(s.text)content+=textHTML(s.text,fontMode,scene.themeFonts);}
    return `<div class="shape" data-shape="${escape(s.id)}" data-source="${escape(s.source)}" style="${style}">${content}</div>`;
  };
  return `<section class="slide" data-house-slide="${scene.number}" style="width:${emu(size[0])}px;height:${emu(size[1])}px;background:${slideFill(scene.background)}" aria-label="${escape(scene.label||'Presentation slide')}">${scene.shapes.map(render).join('')}</section>`;
}
