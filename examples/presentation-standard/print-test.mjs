import fs from 'node:fs';
import {chrome} from '../../plugins/nevron-brand/skills/presentation-standard/build.mjs';
process.env.NEVRON_CHROME_ARGS=JSON.stringify(['--no-sandbox','--in-process-gpu']);
let h=fs.readFileSync('examples/presentation-standard/deck/index.html','utf8');
const slides=h.match(/<section[\s\S]*?<\/section>/g);
h=h.replace('</main>','</main><div class="print-deck">'+slides.map(s=>'<svg xmlns="http://www.w3.org/2000/svg" width="960pt" height="540pt" viewBox="0 0 960 540"><foreignObject width="960" height="540"><div xmlns="http://www.w3.org/1999/xhtml">'+s+'</div></foreignObject></svg>').join('')+'</div>');
h=h.replace('</style>','.print-deck{display:none}@media print {.stage{display:none!important}.print-deck{display:block}.print-deck>svg{display:block;break-after:page}.print-deck .slide{display:block;break-after:auto}} </style>');
fs.writeFileSync('examples/presentation-standard/deck/print-test.html',h);
chrome('examples/presentation-standard/deck/print-test.html',['--print-to-pdf=C:/Users/Kaja/nevron-brand-agent/examples/presentation-standard/deck/print-test.pdf','--no-pdf-header-footer']);
