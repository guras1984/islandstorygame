// Saved gameplay data and deterministic rules for the island's new life loop.
export const HAVENS=[
 {name:'모닥불',icon:'🔥',cost:{wood:3,stone:2},unlock:'동물 쉼터와 섬 꾸미기'},
 {name:'동굴',icon:'🪨',cost:{wood:5,stone:5,food:2},unlock:'과일나무 밭과 낚시터'},
 {name:'누더기집',icon:'⛺',cost:{wood:10,stone:6,food:4},unlock:'주민 주택과 밭, 첫 이웃'},
 {name:'초가집',icon:'🌾',cost:{wood:18,stone:12,food:8},unlock:'벌목장·채석장·식당과 시설 2단계'},
 {name:'작은집',icon:'🏠',cost:{wood:28,stone:20,seaweed:2},unlock:'창고·광장과 생활 공간'},
 {name:'집',icon:'🏡',cost:{wood:40,stone:30,scrap:3},unlock:'주택 단지·회관과 시설 3단계'},
 {name:'큰집',icon:'🏘️',cost:{wood:60,stone:45,shell:3},unlock:'항구와 금화로 사는 탐험선'},
 {name:'빌라',icon:'🏰',cost:{wood:90,stone:70,scrap:5,shell:5},unlock:'대형 항구와 대형선'}
];
export const CATCHES=[
 {id:'minnow',name:'은빛 작은물고기',icon:'🐟',price:5,weight:32,level:1,desc:'얕은 바다에서 반짝이는 작은 이웃.'},
 {id:'seabass',name:'줄무늬 바닷물고기',icon:'🐠',price:9,weight:20,level:1,desc:'나무 낚시터 주변을 천천히 헤엄쳐요.'},
 {id:'seaweed',name:'해초',icon:'🌿',price:3,weight:16,level:1,desc:'말리면 지붕과 생활 도구를 만들 수 있어요.'},
 {id:'shell',name:'조개',icon:'🐚',price:6,weight:12,level:1,desc:'고운 빛깔의 건축·장식 재료예요.'},
 {id:'scrap',name:'재활용 조각',icon:'♻️',price:4,weight:16,level:1,desc:'바다 쓰레기를 분리해 얻은 쓸모 있는 재료.'},
 {id:'driftwood',name:'유목',icon:'🪵',price:4,weight:8,level:1,desc:'먼 바다에서 떠밀려온 나무예요.'},
 {id:'moonfish',name:'달빛물고기',icon:'✨',price:25,weight:5,level:2,desc:'발전한 낚시터에 찾아오는 희귀한 물고기.'},
 {id:'chest',name:'오래된 상자',icon:'🎁',price:18,weight:3,level:2,desc:'카피바라가 금화와 바꿔주는 바다의 보물.'}
];
export const DECOR=[
 {id:'bench',name:'나무 벤치',icon:'🪑',cost:{wood:5},radius:1,desc:'주민이 앉아 쉬는 자리.'},
 {id:'flowers',name:'들꽃 화단',icon:'🌼',cost:{wood:1,food:2},radius:.55,desc:'주민이 다가가 꽃을 구경해요.'},
 {id:'path',name:'돌길',icon:'🟫',cost:{stone:2},radius:.65,desc:'산책길을 잇는 작은 디딤돌.'},
 {id:'fence',name:'나무 울타리',icon:'🪵',cost:{wood:3},radius:.8,desc:'공간을 나누는 낮은 울타리.'},
 {id:'lamp',name:'섬 조명',icon:'🏮',cost:{wood:4,stone:2,scrap:1},radius:.5,desc:'밤이 되면 은은하게 빛나요.'}
];
export const GATES={haven:0,habitat:1,orchard:2,fishing:2,house:3,pond:3,farm:3,lumber:4,quarry:4,store:4,warehouse:5,plaza:5,cottages:6,council:6,dock:7,boat:7,ship:8};
export const havenLevel=s=>Number(s.buildings.haven)||0;
export function catchChoice(lv,random=Math.random()){const list=CATCHES.filter(c=>c.level<=lv),sum=list.reduce((n,c)=>n+c.weight,0);let value=Math.max(0,Math.min(.999999,random))*sum;for(const c of list){value-=c.weight;if(value<0)return c;}return list[list.length-1];}
export function initLife(s,raw={}){s.lifeVersion=1;s.items={};for(const c of CATCHES)s.items[c.id]=Math.max(0,Math.floor(Number(raw.items?.[c.id])||0));s.discoveries={...(raw.discoveries||{})};s.decorPlaced=Array.isArray(raw.decorPlaced)?raw.decorPlaced.filter(d=>DECOR.some(k=>k.id===d.kind)&&Number.isFinite(d.x)&&Number.isFinite(d.z)).map(d=>({...d})):[];s.friendship=Math.max(0,Number(raw.friendship)||0);s.friendActions={...(raw.friendActions||{})};s.friendGifts=Array.isArray(raw.friendGifts)?[...raw.friendGifts]:[];s.lifeEvents={...(raw.lifeEvents||{})};s.beachPickups=Array.isArray(raw.beachPickups)?raw.beachPickups:[];s.eveningDay=Number.isFinite(raw.eveningDay)?raw.eveningDay:-1;s.collectionRewards=Array.isArray(raw.collectionRewards)?raw.collectionRewards:[];s.residentRequests={...(raw.residentRequests||{})};s.catchCount=Math.max(0,Number(raw.catchCount)||0);s.recycled=Math.max(0,Number(raw.recycled)||0);s.lettersFound=Math.max(0,Number(raw.lettersFound)||0);return s;}
export const itemCount=(s,k)=>k in s.items?s.items[k]:Number(s[k])||0;
export const canPay=(s,c)=>Object.entries(c).every(([k,n])=>itemCount(s,k)>=n);
export function spend(s,c){if(!canPay(s,c))return false;for(const [k,n]of Object.entries(c)){if(k in s.items)s.items[k]-=n;else s[k]-=n;}return true;}
export const PRICES={wood:1,stone:2,food:1,crystal:15,...Object.fromEntries(CATCHES.map(c=>[c.id,c.price]))};
export function exchange(s,key,quantity,buy=false){quantity=Number(quantity);if(!Number.isSafeInteger(quantity)||quantity<1||quantity>999||!(key in PRICES))return false;const unit=PRICES[key]*(buy?3:1);if(buy){if(s.gold<unit*quantity)return false;s.gold-=unit*quantity;if(key in s.items)s.items[key]+=quantity;else s[key]+=quantity;}else{if(itemCount(s,key)<quantity)return false;if(key in s.items)s.items[key]-=quantity;else s[key]-=quantity;s.gold+=unit*quantity;}return true;}
export const PERSONALITIES=[{name:'정원 친구',like:'flowers',phrase:'꽃 앞에 있으면 마음이 편안해져요.'},{name:'바다 친구',like:'fishing',phrase:'물결을 보고 있으면 시간이 천천히 가요.'},{name:'비를 좋아하는 친구',like:'rain',phrase:'비 오는 날의 흙냄새가 좋아요.'},{name:'산책 친구',like:'bench',phrase:'잠깐 앉았다가 섬을 한 바퀴 걸어볼까요?'}];
