import {HAVENS,GATES,initLife,havenLevel} from './life-rules.js?v=15';
// Serializable island rules; no renderer, clock or account dependency.
export const BUILDINGS = [
 ['habitat','동물 쉼터','🌿','nature',10,0,5,0,null,[-4,0],2.2,['작은 먹이터','나무 쉼터','숲속 안식처'],'토끼가 안심하고 살 곳을 만들어요.'],
 ['orchard','과일나무 밭','🍊','nature',18,6,0,0,'habitat',[-8,-10],3.8,['어린 과일나무','열매 과수원','풍성한 과수원'],'새가 찾아와 둥지를 틀고 식량을 생산해요.'],
 ['pond','연못','💧','nature',16,18,8,0,'orchard',[-11,3],3.6,['작은 연못','돌담 연못','생태 연못'],'사슴·물고기·개구리가 찾아와요.'],
 ['farm','밭','🥕','production',20,10,0,0,'pond',[10,8],3.2,['작은 텃밭','울타리 밭','풍요로운 농장'],'식량을 생산하고 농사 일꾼을 도와줘요.'],
 ['house','주민 주택','🏠','life',30,16,15,0,'farm',[1,-1],2.1,['작은 오두막','목조 주택','벽돌 주택'],'빈방이 있으면 입주 희망자가 방문해요.'],
 ['lumber','벌목장','🪓','production',30,18,0,0,'house',[-11,-4],2.7,['벌목 작업대','지붕 작업장','제재소'],'벌목 일꾼의 생산량을 높여요.'],
 ['quarry','채석장','🪨','production',25,25,0,0,'lumber',[13,-9],3.3,['돌 작업대','돌 가공소','석재 공방'],'채광 일꾼의 생산량을 높여요.'],
 ['store','식당','🍲','life',30,15,0,0,'quarry',[4,-.2],2,['야외 조리대','마을 식당','큰 음식점'],'이웃이 모여 식사하는 공간이에요.'],
 ['cottages','주민 주택 단지','🏘️','life',55,30,20,15,'store',[0,11],5.2,['작은 주택 단지','목조 주택 단지','벽돌 주택 단지'],'더 많은 이웃이 살 방을 마련해요.'],
 ['warehouse','자재 창고','📦','production',45,30,0,20,'cottages',[12,0],2.6,['나무 창고','자재 창고','큰 물류 창고'],'자재를 보관하고 주민 생산을 더 오래 이어가요.'],
 ['plaza','마을 광장','🌷','life',35,45,0,25,'warehouse',[0,5],4.3,['작은 쉼터','분수 광장','꽃빛 광장'],'주민들이 쉬는 곳. 밤에는 조명이 켜져요.'],
 ['council','주민센터','🏛️','life',60,50,0,40,'plaza',[1,-12],3,['마을 모임집','주민센터','큰 주민센터'],'주민 작업과 오프라인 생산을 관리해요.'],
 ['dock','항구','⚓','sea',75,50,0,45,'council',[0,24],3,['나무 선착장','소형 항구','대형 항구'],'업그레이드하면 더 좋은 배를 만들어요.'],
 ['boat','탐험선','⛵','sea',65,30,0,30,'dock',[4,27],2,['작은 탐험선','튼튼한 탐험선','원양 탐험선'],'마을이 성장한 뒤 주변 섬을 탐험해요.'],
 ['ship','대형선','🚢','sea',110,65,0,75,'boat',[4,27],2,['대형 탐험선','교역 탐험선','섬나라 기함'],'먼 바다를 탐험하고 이웃 섬과 교류해요.']
].map(([id,name,icon,category,wood,stone,food,gold,need,origin,radius,forms,desc])=>({id,name,icon,category,cost:Object.fromEntries(Object.entries({wood,stone,food,gold}).filter(([,v])=>v)),need,origin,radius,forms,desc}));
BUILDINGS.unshift({id:'haven',name:'중심 보금자리',icon:'🔥',category:'life',cost:HAVENS[0].cost,need:null,origin:[-1,-1],radius:2.7,forms:HAVENS.map(h=>h.name),desc:'모닥불에서 빌라까지, 섬의 다음 이야기를 여는 보금자리예요.'});
BUILDINGS.push({id:'fishing',name:'낚시터',icon:'🎣',category:'nature',cost:{wood:8,stone:4},need:null,origin:[-21,4],radius:2,forms:['작은 낚시터','나무 낚시터','바다 낚시터'],desc:'해변에서 물고기와 바다의 선물을 낚아요.'});
for(const d of BUILDINGS){d.need=null;if(d.id==='boat')d.cost={gold:80};if(d.id==='ship')d.cost={gold:250};if(!['boat','ship'].includes(d.id))delete d.cost.gold;if(d.id==='house')d.cost={wood:8,stone:4,food:3};}
export const PROFILES=[{name:'하루',skill:'food',job:'농부',need:'farm',line:'작은 밭을 보니 마음이 놓여요. 함께 열매를 기르며 살고 싶어요.'},{name:'도윤',skill:'wood',job:'목수',need:'house',line:'나무로 무언가 만드는 걸 좋아해요. 이 섬에서 새 출발을 해도 될까요?'},{name:'소라',skill:'stone',job:'채광사',need:'house',line:'돌 속에 숨은 이야기를 찾는 게 제 일이에요. 빈방이 있다면 머물고 싶어요.'},{name:'유나',skill:'food',job:'요리사',need:'store',line:'따뜻한 음식을 나눌 식당이 있네요. 이웃이 되어도 괜찮을까요?'}];
export const level=(s,id)=>Number(s.buildings[id])||0;
export function capacity(s){return level(s,'house')*2+level(s,'cottages')*4+s.homes.reduce((n,h)=>n+h.level*2,0);}
export function requirements(s,d){const req=[];if(havenLevel(s)<(GATES[d.id]||0))req.push(['haven',GATES[d.id]]);if(d.id==='boat'&&level(s,'dock')<1)req.push(['dock',1]);if(d.id==='ship'){if(level(s,'dock')<3)req.push(['dock',3]);if(level(s,'boat')<2)req.push(['boat',2]);}return req;}
export function upgradeCost(s,d,l=level(s,d.id)){if(d.id==='haven')return HAVENS[l]?.cost||{};if(d.id==='boat'||d.id==='ship')return {gold:(d.id==='ship'?150:45)*l};const c={wood:Math.ceil((d.cost.wood||8)*(.65+l*.35)),stone:Math.ceil((d.cost.stone||5)*(.65+l*.35))};if(d.id==='fishing'&&l===2)c.scrap=2;if(d.id==='warehouse'&&l===2)c.shell=2;return c;}
export function normalize(raw={}){
const s={wood:0,stone:0,food:0,gold:0,crystal:0,buildings:{},jobs:{wood:0,stone:0,food:0},discovered:[],colonies:[],kills:0,started:false,placements:{},homes:[],residents:[],visitor:null,visitTimer:0,visitorSerial:0,seen:[],saplings:[],time:8*50,weather:'clear',weatherLeft:210,afterRain:0,rainCount:0,mushrooms:[],events:{},totals:{wood:0,stone:0,food:0},decorations:[],audioOn:false,volume:.3,appearance:{character:'jun',shirt:'ocean',hat:'sun'},characterChosen:false,...raw};
s.appearance={character:'jun',shirt:['ocean','leaf'].includes(raw.appearance?.shirt)?raw.appearance.shirt:'ocean',hat:['sun','tangerine'].includes(raw.appearance?.hat)?raw.appearance.hat:'sun'};s.characterChosen=raw.characterChosen===true;
s.buildings={...(raw.buildings||{})};for(const d of BUILDINGS)s.buildings[d.id]=Math.min(d.forms.length,Math.max(0,Number(s.buildings[d.id])||0));
if(raw.buildings?.dock2)s.buildings.dock=Math.max(2,s.buildings.dock);delete s.buildings.dock2;
if(raw.lifeVersion===undefined&&Object.values(raw.buildings||{}).some(Boolean))s.buildings.haven=Math.max(s.buildings.haven,raw.buildings?.ship?8:raw.buildings?.dock||raw.buildings?.boat||raw.buildings?.council?7:raw.buildings?.cottages?6:raw.buildings?.house?5:raw.buildings?.pond?3:2);
// Preserve residents of older saves, but new homes only invite visitors.
if(!Array.isArray(raw.residents)){const n=(raw.buildings?.house?3:0)+(raw.buildings?.cottages?4:0)+(raw.buildings?.council?2:0)+(raw.colonies?.length||0)*2;if(n){if(s.buildings.house)s.buildings.house=Math.max(2,s.buildings.house);if(s.buildings.cottages)s.buildings.cottages=Math.max(2,s.buildings.cottages);while(capacity(s)<n)s.homes.push({id:'legacy-'+s.homes.length,level:1,x:-17+s.homes.length*5,z:14,rotation:0});s.residents=Array.from({length:n},(_,i)=>({...PROFILES[i%4],id:i+1,jobKey:null}));let index=0;for(const [job,count]of Object.entries(raw.jobs||{}))for(let i=0;i<count&&index<n;i++)s.residents[index++].jobKey=job;}}
s.visitorSerial=Math.max(s.visitorSerial,...s.residents.map(r=>Number(r.id)||0));s.jobs={wood:0,stone:0,food:0};for(const r of s.residents)if(r.jobKey in s.jobs)s.jobs[r.jobKey]++;s.buildings.fishing=Math.max(1,s.buildings.fishing);s.productionProgress={...(raw.productionProgress||{})};s.storagePriority=raw.storagePriority||'wood';s.overflow={...(raw.overflow||{})};s.lastActive=Math.max(0,Number(raw.lastActive)||0);s.regionVersion=1;return initLife(s,raw);
}
export const EVENT_DEFS=[{id:'supplies',title:'숲길을 위한 나무',giver:'섬 게시판',text:'직접 모은 목재 20개를 기부해 작은 쉼터를 준비해요.',resource:'wood',goal:20,pay:{wood:20},reward:{gold:18,stone:8}},{id:'picnic',title:'이웃과 나누는 소풍',giver:'방문객의 편지',text:'열매 15개를 직접 모아 소풍 바구니를 준비해요.',resource:'food',goal:15,pay:{food:15},reward:{gold:20,wood:10}},{id:'rain',title:'비 온 뒤의 작은 선물',giver:'숲속 관찰 기록',text:'비가 그친 뒤 반짝이는 버섯 3개를 모아요.',resource:'mushroom',goal:3,pay:{},reward:{gold:30},decoration:'버섯 정원'},{id:'neighbors',title:'우리 섬 첫 이웃들',giver:'섬 게시판',text:'대화로 주민 3명을 맞이해요.',resource:'residents',goal:3,pay:{},reward:{gold:35,food:20},decoration:'환영 꽃화분'}];

// Shared online/offline production: one item per worker cycle, bounded storage.
export const storageCapacity=s=>120+(Number(s.buildings.warehouse)||0)*180;
export const storageUsed=s=>['wood','stone','food'].reduce((n,k)=>n+Math.max(0,Number(s[k])||0),0);
export const jobFacility={wood:'lumber',stone:'quarry',food:'farm'};
export const jobSlots=(s,key)=>1+(Number(s.buildings[jobFacility[key]])||0)*2;
export const offlineHours=s=>Math.min(8,4+Math.max(0,(Number(s.buildings.council)||1)-1)*2);
export function workerSeconds(s,r){return (r.skill===r.jobKey?15:20)/(1+Math.max(0,(Number(s.buildings.council)||1)-1)*.1);}
export function produceFor(s,seconds){
 const result={wood:0,stone:0,food:0};let free=Math.max(0,storageCapacity(s)-storageUsed(s));
 const order=[s.storagePriority,...Object.keys(result).filter(k=>k!==s.storagePriority)];s.productionProgress??={};
 for(const key of order){const workers=s.residents.filter(r=>r.jobKey===key).slice(0,jobSlots(s,key));for(const r of workers){const cycle=workerSeconds(s,r),prev=Number(s.productionProgress[r.id])||0,total=prev+Math.max(0,seconds),count=Math.min(free,Math.floor(total/cycle));s.productionProgress[r.id]=free>count?total%cycle:0;s[key]+=count;result[key]+=count;free-=count;}}
 return result;
}
export function settleOffline(s,now=Date.now()){
 const previous=s.lastActive;const elapsed=previous?Math.max(0,(now-previous)/1000):0;
 s.lastActive=Math.max(previous||0,now);const credited=Math.min(elapsed,offlineHours(s)*3600);
 const items=produceFor(s,credited);return {elapsed,credited,items};
}
export function storeItems(s,items){s.overflow??={};let free=Math.max(0,storageCapacity(s)-storageUsed(s));for(const [key,n] of Object.entries(items)){if(['wood','stone','food'].includes(key)){const accepted=Math.min(free,n);s[key]+=accepted;s.overflow[key]=(s.overflow[key]||0)+n-accepted;free-=accepted;}else if(key in s.items)s.items[key]+=n;else s[key]=(s[key]||0)+n;}}
export function collectOverflow(s){const old={...s.overflow};s.overflow={};storeItems(s,old);}
