// Reproducible worked example; all visuals are supplied house-deck assets.
import fs from 'node:fs';
import {flatten} from '../../plugins/nevron-brand/skills/presentation-standard/build.mjs';
const house=JSON.parse(fs.readFileSync(new URL('../../plugins/nevron-brand/skills/presentation-standard/reference/house.json',import.meta.url)));
const demo='Illustrative data for this example; not Nevron performance claims.';
function donutStep(number){
  const text={};for(const s of flatten(house.slides[number-1].shapes))if(s.text){
    const content=s.text.paragraphs.map(p=>p.runs.map(r=>r.text).join('')).join(' ');
    if(content.startsWith('Sources'))text[s.id]=demo;
    else if(content.startsWith('75'))text[s.id]=['75 %','demo services ready for review'];
    else if(content.startsWith('only 25'))text[s.id]=[{runs:['First ', '25 %']},'ready for the pilot'];
    else if(content.startsWith('only 19'))text[s.id]=[{runs:['First ', '19 %']},'of demo guests active'];
    else if(content.startsWith('94'))text[s.id]=['94 %','of demo guests invited'];
    else if(content.includes("hotel's needs"))text[s.id]='Ready for the hotel team?';
    else if(content.includes("guest's needs"))text[s.id]='Ready for the guest?';
  }return {text};
}
const title={runs:['NevronCore','\n','\n','Guest experience','','','']};
const deck={title:'NevronCore — a connected guest experience',mediaRoot:'../../../assets/ppt-extracted/media',
  fontDir:'../../../assets/ppt-extracted/fonts',slides:[
    {layout:'cover',label:'NevronCore guest experience',text:{'2':[title]}},
    {layout:'cover-photo',label:'Hospitality in context',text:{'2':[{runs:['A connected stay','\n','\n','From welcome to return','','','']}]}},
    {layout:'steps-3',label:'Our discussion',section:'Guest experience',text:{'10':'Our discussion','18':['1. Experience','','Guest touchpoints.'],'27':['2. Platform','','Content and services.'],'31':['3. Delivery','','A focused pilot.']}},
    {layout:'section',label:'The guest journey',text:{'7':'Make every guest touchpoint count'}},
    {layout:'bullets',label:'Easy access',section:'Guest experience',text:{'12':['Easy access','','A clear guest interface','','Services within reach','','No app-store download','']}},
    {layout:'split',label:'Discover relevant services',section:'Guest experience',text:{'9':['Relevant services','For every guest','','Discover the hotel offer','','Find experiences','','Choose what matters']}},
    {layout:'cards-3',label:'Content across the property',text:{'20':'Content operations','17':['Display network','','Bring content to the right screens.'],'18':['Playlists and schedules','','Plan content for each moment.'],'19':['Central control','','Manage displays in one place.']}},
    {layout:'cards-8',label:'Platform capabilities',text:{'20':'Platform capabilities','2':['Solution composer','','Build the guest portal.'],'4':['Content management','','Publish from one place.'],'5':['Access manager','','Manage permissions.'],'6':['Service library','','Connect guest services.'],'7':['Analytics','','Understand usage.'],'8':['Connectivity','','Link the ecosystem.'],'9':['Recommendations','','Surface relevant content.'],'10':['Core components','','Manage users and devices.']}},
    {layout:'section',label:'A measured pilot',text:{'7':'Start focused. Learn from use.'}},
    {layout:'donut-build',label:'Illustrative pilot progress',steps:[5,6,7,8,9,10].map(donutStep)},
    {layout:'panel-build',label:'Why the guest experience matters'},
    {layout:'panel-step-4',label:'Operational impact'},
    {layout:'stats',label:'Illustrative pilot scope',source:demo,text:{'44':'An illustrative pilot','7':'3','9':'guest touchpoints','12':'8','13':'platform capabilities','18':'1','22':'shared content plan'}},
    {layout:'devices',label:'The in-room experience',section:'TV experience'},
    {layout:'devices',label:'A closer look at the interface',section:'Interface gallery'},
    {layout:'cards-3-light',label:'Pilot responsibilities',text:{'8':'A shared delivery plan','18':['Welcome','','','Hotel team reviews content before launch.'],'27':['Services','','','Operations reviews services weekly.'],'31':['Feedback','','','Project team reviews feedback after the pilot.']}},
    {layout:'photo-callout-build',label:'Content in context',steps:[{text:{'8':'Content in context','14':'Tailor services to guest needs.'}},{text:{'6':'Content in context','15':'Tailor services to guest needs.','17':'Learn from use throughout the pilot.'}}]},
    {layout:'closing',label:'Thank you',text:{'2':'Thank you'}}
  ]};
fs.writeFileSync(new URL('./deck.json',import.meta.url),JSON.stringify(deck,null,2));
