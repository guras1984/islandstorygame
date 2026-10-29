import * as THREE from './dist/vendor/three.module.js';
import * as rules from './dist/progression.js';
import * as hero from './dist/character.js';
import * as life from './dist/life-rules.js';
import * as navigation from './dist/navigation.js';
import * as uiIcons from './dist/icons.js';
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const nodes=new Map();function node(sel){if(!nodes.has(sel))nodes.set(sel,{textContent:'',innerHTML:'',style:{setProperty(){}},open:false,hidden:false,scrollTop:0,parentElement:{scrollTop:0},classList:{toggle(key,value){this[key]=value;}},setAttribute(){},querySelectorAll(){return[]},append(){},show(){this.open=true},showModal(){this.open=true},close(){this.open=false}});return nodes.get(sel)}
const events={},memory=new Map(),scheduled=[];const gainParam=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
class FakeAudio {constructor(){this.sampleRate=1000;this.currentTime=1;this.state='running';this.destination={};}resume(){}createGain(){return {gain:gainParam(),connect(){},disconnect(){}}}createOscillator(){return {frequency:gainParam(),connect(){},disconnect(){},start(t){scheduled.push(t)},stop(){}}}createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)}}createBufferSource(){return {connect(){},start(){}}}createBiquadFilter(){return {frequency:gainParam(),connect(){}}}}
const ctx=vm.createContext({...rules,...hero,...life,...uiIcons,...navigation,THREE:{...THREE,WebGLRenderer:class{constructor(){this.shadowMap={};this.domElement={setAttribute(){},focus(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:1280,height:720}}}}setPixelRatio(){}setSize(){}render(){}}},AudioContext:FakeAudio,document:{querySelector:node,querySelectorAll:()=>[],body:node('body'),activeElement:{tagName:'BODY'},addEventListener(){},hidden:false},innerWidth:1280,innerHeight:720,devicePixelRatio:1,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},addEventListener(name,fn){(events[name]??=[]).push(fn)},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>false,location:{reload(){}},console,Math,Date});
const source=fs.readFileSync(new URL('./dist/game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);const emit=(name,event)=>events[name].forEach(fn=>fn(event));node('#welcome').open=false;
// Clean starts and migration preserve old islands while adding eight-stage progression.
assert.equal(run('havenLevel(s)'),0);assert.equal(run('nextGoal().title').includes('모닥불'),true);
const legacy=rules.normalize({buildings:{house:2,council:2,boat:2,dock:2},wood:41,residents:[{id:1,name:'하루',jobKey:'wood'}]});assert.equal(legacy.wood,41);assert.equal(life.havenLevel(legacy),7);assert.equal(legacy.buildings.boat,2);assert.equal(legacy.residents.length,1);assert.equal(legacy.items.scrap,0);
assert.equal(rules.normalize({lifeVersion:1,buildings:{haven:2}}).buildings.haven,2);
run('s.wood=10;s.stone=10;s.food=10;openAvatarEditor();customizeHero("shirt","leaf");customizeHero("hat","tangerine");$("#playerName").value="별이";confirmHero()');assert.equal(run('s.appearance.shirt'),'leaf');assert.equal(run('s.wood'),10);
// Collection spends time and pays exactly one only on completion; repeated taps cannot restart it.
run('player.position.set(resources[0].x,.45,resources[0].z);resources[0].cool=0');const before=run('s.wood');assert.equal(run('gatherResource(resources[0])'),true);run('update(1)');assert.equal(run('s.wood'),before);assert.equal(run('gatherResource(resources[0])'),false);run('update(1);update(1.01)');assert.equal(run('s.wood'),before+1);assert.equal(run('workTask'),null);
run('resources[0].cool=0;gatherResource(resources[0]);update(1)');emit('keydown',{code:'KeyD',key:'d',preventDefault(){}});run('update(3)');emit('keyup',{code:'KeyD'});assert.equal(run('workTask'),null);assert.equal(run('s.wood'),before+1);
run('resources[0].cool=0;player.position.copy(resources[0].g.position);gatherResource(resources[0])');const left=run('workTask.left');run('activateTarget({kind:"resource",ref:resources[0]})');assert.equal(run('workTask.left'),left);run('cancelMove()');
// Korean movement and camera pitch, pinch and rotated touch remain independent.
const pos=run('player.position.clone()');emit('keydown',{code:'KeyW',key:'ㅈ',preventDefault(){}});run('update(.2)');emit('keyup',{code:'KeyW'});assert.ok(pos.distanceTo(run('player.position.clone()'))>.5);
run('renderer.domElement.onpointerdown({button:0,pointerId:1,pointerType:"mouse",clientX:600,clientY:120});renderer.domElement.onpointermove({pointerId:1,pointerType:"mouse",clientX:630,clientY:180});renderer.domElement.onpointerup({pointerId:1,pointerType:"mouse",clientX:630,clientY:180})');assert.ok(run('pitch')>.62);
assert.equal(run('landscapeMetrics(390,844).width'),844);ctx.innerWidth=390;ctx.innerHeight=844;run('syncGameLayout()');assert.equal(run('portraitGame'),true);assert.equal(run('gamePointer({clientX:310,clientY:120}).clientY'),80);
run('renderer.domElement.onpointerdown({button:0,pointerId:2,pointerType:"touch",clientX:90,clientY:100});renderer.domElement.onpointermove({pointerId:2,pointerType:"touch",clientX:90,clientY:143})');assert.equal(run('joystick.active'),true);assert.equal(run('joystick.dx'),1);run('renderer.domElement.onpointerup({pointerId:2,pointerType:"touch",clientX:90,clientY:143})');assert.equal(node('#floatingJoystick').hidden,true);
ctx.innerWidth=1280;ctx.innerHeight=720;run('syncGameLayout()');
// Trading is quantity-checked and cannot create gold through buy/sell arbitrage.
run('s.gold=100;s.wood=10');assert.equal(run('exchange(s,"wood",3,true)'),true);assert.equal(run('s.gold'),91);assert.equal(run('s.wood'),13);assert.equal(run('exchange(s,"wood",3,false)'),true);assert.equal(run('s.gold'),94);for(const quantity of [-1,0,1.5,1000,NaN]){ctx.quantity=quantity;assert.equal(run('exchange(s,"wood",quantity,false)'),false);}assert.equal(run('exchange(s,"shell",2,true)'),true);assert.equal(run('s.items.shell'),2);
// Every build and upgrade uses reachable gates, and direct ground taps commit exactly once.
run('for(const k of ["wood","stone","food","gold","crystal"])s[k]=10000;for(const k of Object.keys(s.items))s.items[k]=100;player.position.set(0,.45,3);');
function spot(id,skip=null){return run(`(()=>{for(let radius=0;radius<=24;radius+=1.5)for(let angle=0;angle<6.28;angle+=.3){let x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;if(validPlacement(${JSON.stringify(id)},x,z,${JSON.stringify(skip)}))return {x,z};}})()`);}
function place(id,mode='build'){run(`startPlacement('${id}','${mode}')`);assert.ok(run('placement'),id+' preview');const point=spot(id);assert.ok(point,id+' fits');run(`placement.x=${point.x};placement.z=${point.z};refreshGhost()`);assert.equal(run('commitPlacement()'),true,id+' commit');run('closeDialogue();dialogueCooldown=0');return point;}
assert.equal(run('requirements(s,defs.find(d=>d.id==="house")).length')>0,true);
run('build("haven")');let point=spot('haven');assert.ok(point);ctx.point=point;
run('camera.position.set(point.x,12,point.z+10);camera.lookAt(point.x,.4,point.z);camera.updateMatrixWorld();clickGround({clientX:640,clientY:360})');assert.equal(run('level(s,"haven")'),1);assert.equal(run('placement'),null);
place('habitat');assert.equal(run('upgrade("habitat")'),false);assert.equal(run('upgrade("haven")'),true);assert.equal(run('level(s,"haven")'),2);assert.equal(run('level(s,"fishing")'),1);
// Fishing requires a pier, equips a rod, waits for a bite, then grants one result after reeling.
run('closeDialogue();const fp=placementOf("fishing");player.position.set(fp.x,.45,fp.z)');const previousCamera=run('[yaw,pitch,zoom]');assert.equal(run('beginFishing()'),true);assert.equal(run('player.userData.rig.rod.visible'),true);assert.equal(run('beginFishing()'),false);assert.equal(run('reelFish()'),false);run('updateFishing(2.1);updateFishing(6.1)');assert.equal(run('fishState.phase'),'bite');const catches=run('s.catchCount');run('updateFishing(2.6)');assert.equal(run('fishState.phase'),'reel');run('updateFishing(2.3)');assert.equal(run('s.catchCount'),catches+1);assert.equal(run('fishState.phase'),'result');run('updateFishing(20)');assert.equal(run('s.catchCount'),catches+1);assert.equal(run('continueFishing()'),true);assert.equal(run('fishState.phase'),'cast');assert.equal(run('continueFishing()'),false);run('cancelMove()');assert.equal(run('fishState'),null);assert.deepEqual(run('[yaw,pitch,zoom]'),previousCamera);assert.equal(run('fishingLine.visible'),false);assert.equal(run('player.userData.rig.rod.visible'),false);run('beginFishing();updateFishing(.8);animateHuman(player,.1,0)');assert.ok(run('player.userData.rig.rightArm.rotation.x')<-1);assert.ok(run('player.userData.rig.leftLeg.rotation.x')<-1);run('cancelMove()');
assert.equal(life.catchChoice(1,0).id,'minnow');for(let i=0;i<50;i++)assert.notEqual(life.catchChoice(1,i/50).id,'moonfish');assert.equal(life.catchChoice(2,.99999).id,'chest');
run('upgrade("haven")');place('house');assert.ok(run('s.visitor'));const residents=run('crew()');run('talkTo(visitorMesh);skipDialogue()');assert.equal(run('crew()'),residents);run('chooseDialogue(0)');assert.equal(run('crew()'),residents+1);
place('farm');run('upgrade("haven")');assert.equal(run('upgrade("habitat")'),true);place('lumber');place('quarry');run('upgrade("haven")');place('warehouse');place('plaza');run('upgrade("haven")');place('council');run('upgrade("haven")');place('dock');const bank=run('s.gold'),timber=run('s.wood');run('build("boat")');assert.equal(run('s.gold'),bank-80);assert.equal(run('s.wood'),timber);assert.equal(run('level(s,"boat")'),1);run('upgrade("haven")');assert.equal(run('level(s,"haven")'),8);assert.equal(run('upgrade("haven")'),false);
// Decor is placed/moved/returned, villagers use it, friendships and optional rewards are one-time.
place('decor:flowers','decor');place('decor:bench','decor');assert.equal(run('s.decorPlaced.length'),2);const decor=run('s.decorPlaced[1]');ctx.decor=decor;assert.ok(run('residentDestination(s.residents[0],3)'));
run('showResidentRequest(s.residents[0]);s.residentRequests[s.residents[0].id]="active";');assert.equal(run('requestFor(s.residents[0]).need()'),true);node('#detailDialog').close();const requestGold=run('s.gold');assert.equal(run('progressResidentRequest(s.residents[0])'),true);assert.equal(run('progressResidentRequest(s.residents[0])'),false);assert.equal(run('s.gold'),requestGold+8);
run('s.friendship=2;befriend(false)');assert.equal(run('s.friendship'),3);assert.equal(run('s.decorTokens.flowers'),1);run('closeDialogue();befriend(false)');assert.equal(run('s.friendship'),3);run('closeDialogue()');
run('s.lifeEvents.clean="active";showLifeEvent("clean")');node('#detailDialog').close();const rewards=run('s.gold');assert.equal(run('progressLifeEvent("clean")'),true);assert.equal(run('progressLifeEvent("clean")'),false);assert.equal(run('s.gold'),rewards+20);run('showLifeEvent("clean")');assert.ok(node('#detailActions').innerHTML.includes('disabled'));node('#detailDialog').close();
run('refreshBeach()');assert.ok(run('s.beachPickups.length')>=3);const beachCount=run('s.beachPickups.length');run('refreshBeach()');assert.equal(run('s.beachPickups.length'),beachCount);
run('s.time=18.5*50;eveningTalk();closeDialogue()');const eveningFood=run('s.food');run('eveningTalk();closeDialogue()');assert.equal(run('s.food'),eveningFood);
run('s.items.driftwood=1;s.wood=10;s.stone=10;s.food=10');const recycledWood=run('s.wood');assert.equal(run('useCatch("driftwood")'),true);assert.equal(run('s.wood'),recycledWood+2);assert.equal(run('useCatch("driftwood")'),false);node('#detailDialog').close();
// Rest visibly lowers the body, survives orbiting, and ends on movement or a removed bench.
run('closeDialogue();const campRest=placementOf("haven");player.position.set(campRest.x+2,.45,campRest.z);s.time=12*50;eveningTalk();closeDialogue();animateHuman(player,.6,0)');assert.ok(run('restState'));assert.ok(run('player.userData.rig.body.position.y')<-.35);assert.ok(run('player.userData.rig.leftLeg.rotation.x')<-1.2);assert.equal(node('#restControl').hidden,false);
run('renderer.domElement.onpointerdown({button:0,pointerId:601,pointerType:"mouse",clientX:800,clientY:160});renderer.domElement.onpointermove({pointerId:601,pointerType:"mouse",clientX:840,clientY:175});renderer.domElement.onpointerup({pointerId:601,pointerType:"mouse",clientX:840,clientY:175})');assert.ok(run('restState'));
emit('keydown',{code:'KeyW',key:'w',preventDefault(){}});run('update(.1)');emit('keyup',{code:'KeyW'});assert.equal(run('restState'),null);assert.equal(node('#restControl').hidden,true);run('animateHuman(player,1,0)');assert.ok(run('player.userData.rig.body.position.y')>-.05);
run('const restBench=s.decorPlaced.find(d=>d.kind==="bench");player.position.set(restBench.x+1,.45,restBench.z);beginRest(restBench);animateHuman(player,.6,0)');assert.equal(run('restState.benchId'),run('s.decorPlaced.find(d=>d.kind==="bench").id'));assert.ok(run('player.userData.rig.body.position.y')>-.2);run('standUp()');assert.equal(run('restState'),null);
// Effects release resources; menus, gates and save migration survive a full reload.
run('updateEffects(3);burst(player.position,"build",200);ripple(player.position)');assert.equal(run('actionFX.length'),80);run('updateEffects(3)');assert.equal(run('actionFX.length'),0);assert.equal(run('actionBursts.length'),0);
run('hudFolded.quest=false;toggleHud("quest")');assert.equal(run('hudFolded.quest'),true);run('toggleHud("resources")');assert.equal(run('hudFolded.resources'),false);run('toggleHud("quest");paintGoal()');assert.ok(node('#questTitle').textContent);
run('assignResident(s.residents[0].id,"wood")');const production=run('s.wood');run('produce(30)');assert.ok(run('s.wood')>production);
run('changeWeather("rain");changeWeather("clear");s.time=23*50;updateWorld(.01)');assert.equal(run('stars.visible'),true);run('s.time=12*50;updateWorld(.01)');assert.equal(run('stars.visible'),false);run('toggleMusic();updateAudio()');assert.ok(scheduled.length>0);
run('sail()');assert.equal(run('sea'),true);assert.equal(run('monsters.length'),0);assert.equal(run('attack()'),false);run('sail();save()');const saved=JSON.parse(memory.get('island-nation-v1')),restored=rules.normalize(saved);assert.equal(restored.buildings.haven,8);assert.equal(restored.residents.length,saved.residents.length);assert.equal(restored.decorPlaced.length,2);assert.equal(restored.friendship,3);assert.equal(restored.lifeEvents.clean,'done');
// Finite deposits vanish exactly at exhaustion, persist waiting slots, and regenerate elsewhere.
run('closeDialogue();standUp();sea=false;const exhausted=resources.find(r=>r.g.visible);player.position.set(exhausted.x,.45,exhausted.z);exhausted.remaining=1;exhausted.cool=0;globalThis.testNode=exhausted;collectResource(exhausted);updateWork(3.1)');assert.equal(run('resources.includes(testNode)'),false);assert.ok(run('s.resourceWaiting.length')>0);run('save()');assert.ok(JSON.parse(memory.get('island-nation-v1')).resourceWaiting.length>0);run('s.resourceWaiting.forEach(w=>w.at=s.time-1);updateNodes(0)');assert.equal(run('s.resourceWaiting.length'),0);assert.ok(run('resources.every(r=>r.remaining>0&&r.remaining<=r.max)'));
run('s.skills.gather.xp=10');assert.equal(run('skillStats("gather").level'),2);assert.equal(run('skillBonus("gather",0)'),1);assert.equal(run('skillBonus("gather",.99)'),0);assert.ok(run('menuTiles()').includes('menu-tile'));

// Slow work, slot limits, storage overflow and exactly-once offline settlement.
const productionState=rules.normalize({lifeVersion:1,buildings:{haven:6,council:3,warehouse:3},residents:[{id:1,skill:'wood',jobKey:'wood'},{id:2,skill:'food',jobKey:'stone'}],lastActive:1000000});
assert.equal(rules.offlineHours(productionState),8);assert.equal(rules.jobSlots(productionState,'wood'),1);
assert.equal(rules.workerSeconds(productionState,productionState.residents[0]),12.5);
const receipt=rules.settleOffline(productionState,1030000);assert.equal(receipt.items.wood,2);assert.equal(receipt.items.stone,1);
assert.equal(Object.values(rules.settleOffline(productionState,1030000).items).reduce((a,b)=>a+b,0),0);
assert.equal(rules.settleOffline(productionState,1000000).credited,0);
productionState.wood=rules.storageCapacity(productionState);productionState.stone=0;productionState.food=0;
assert.equal(rules.produceFor(productionState,1000).wood,0);rules.storeItems(productionState,{wood:7});assert.equal(productionState.overflow.wood,7);
productionState.wood-=7;rules.collectOverflow(productionState);assert.equal(productionState.overflow.wood,0);assert.equal(productionState.wood,rules.storageCapacity(productionState));
const capped=rules.normalize({lifeVersion:1,residents:[{id:1,jobKey:'wood',skill:'wood'}],lastActive:1000});assert.equal(rules.settleOffline(capped,1000+86400000).credited,14400);assert.equal(capped.wood,120);
run('s.buildings.haven=0');assert.equal(run('insideLand(-30,-23)'),false);run('s.buildings.haven=2');assert.equal(run('insideLand(-30,-23)'),true);run('s.buildings.haven=8');
assert.ok(run('landPath(new THREE.Vector3(-6,0,-2),new THREE.Vector3(-30,0,-23))'));
run('save()');assert.ok(memory.has('island-nation-v1-backup'));
console.log('PASS: offline caps, no duplicate credit, reversed clock, specialty pace, worker slots, full storage, overflow recovery, terrain gates and safe paths.');
// Portrait onboarding, personal names, bounded keypad and quiet action/weather HUD.
assert.equal(run('playerName()'),'별이');assert.equal(run('cleanName(" <script>별이! ")'),'script별이');
assert.equal(rules.normalize({playerName:'별이'}).playerName,'별이');
run('openAvatarEditor();$("#playerName").value="   "');assert.equal(run('confirmHero()'),false);assert.equal(node('#welcome').open,true);
run('$("#playerName").value="바다친구";confirmHero()');assert.equal(run('playerName()'),'바다친구');
run('s.wood=23;tradeMode="sell";tradeItem="wood";tradeAmount=1;keypadFresh=true;keypadDraft="1";pressTradeDigit("2");pressTradeDigit("5")');assert.equal(run('keypadDraft'),'25');run('pressTradeDigit("확인")');assert.equal(run('tradeAmount'),23);
run('tradeMode="buy";s.gold=10;tradeItem="wood"');assert.equal(run('tradeMaximum()'),3);
run('cancelMove();standUp();elapsed+=5;actionMenuUntil=0;updateActionMenuVisibility()');assert.equal(node('body').classList['performing-action'],false);
run('workTask={};updateActionMenuVisibility()');assert.equal(node('body').classList['performing-action'],true);run('workTask=null;updateActionMenuVisibility()');assert.equal(node('body').classList['performing-action'],false);
const notice=node('#toastMessage').textContent;run('changeWeather("snow");updateQuietWeather(.1)');assert.equal(run('drifting.visible'),true);assert.equal(node('#toastMessage').textContent,notice);run('changeWeather("petals");updateQuietWeather(.1)');assert.equal(run('drifting.visible'),true);run('changeWeather("wind");updateQuietWeather(.1)');assert.equal(run('drifting.visible'),false);run('changeWeather("clear")');
run('hudFolded.nav=true;paintHud()');assert.equal(run('hudFolded.nav'),false);
ctx.window={visualViewport:{width:390,height:650,offsetLeft:0,offsetTop:30}};run('syncGameLayout()');assert.equal(run('viewWidth'),650);assert.equal(run('gamePointer({clientX:310,clientY:150}).clientX'),120);delete ctx.window;run('syncGameLayout()');
console.log('PASS: names and empty-name validation, keypad limits, action HUD, quiet snow/petals/wind, viewport offsets and mandatory bottom menu.');
if(process.argv.includes('--fixture'))fs.writeFileSync('/private/tmp/island-qa-fixture.json',JSON.stringify({...saved,time:10*50,weather:'clear',weatherLeft:150,gold:120,wood:100,stone:80,food:80,audioOn:false,started:true,characterChosen:true}));
console.log('PASS: delayed one-item collection/cancel/no duplicate; eight-stage reachable progression; legacy migration; direct-click construction; currency-only boats; trade validation; rod/wait/bite/reel/cancel; catch tiers; decor/resident use; friendship one-time gifts; optional events; daily beach; evening rewards; orbit/pinch/rotated joystick; particles cleanup; audio/weather/peaceful sailing/save.');

// Terrain matches rendered vertices, navigation and all grounded actors.
assert.equal(navigation.terrainElevation(0,3),0);
assert.equal(navigation.terrainElevation(18,-3),0);
assert.ok(navigation.terrainElevation(32,-7)>2.5);
assert.ok(navigation.terrainElevation(0,-33)>1.5);
for(let x=19;x<42;x+=.2)assert.ok(Math.abs(navigation.terrainElevation(x+.2,-7)-navigation.terrainElevation(x,-7))<.14);
const land=navigation.createLandGeometry(26,-6,17*.94,(a,r)=>r*(1+.075*Math.sin(a*3+.6)+.045*Math.sin(a*5-1)));
const positions=land.attributes.position,topCount=1+Math.ceil(17*.94*2)*96;
for(let i=0;i<topCount;i+=17){assert.ok(Math.abs(positions.getY(i)-.1-navigation.terrainElevation(26+positions.getX(i),-6+positions.getZ(i)))<1e-5);}
assert.ok(Array.from(land.attributes.normal.array).every(Number.isFinite));land.dispose();
run('closeDialogue();cancelMove();standUp();sea=false;focusPoint=null;s.buildings.haven=8;player.position.set(32,0,-7);update(.016)');
assert.ok(Math.abs(run('player.position.y')-navigation.actorHeight(32,-7))<1e-9);
const route=run('landPath(player.position,new THREE.Vector3(30,0,-7))');assert.ok(route);assert.ok(Math.abs(route.at(-1).y-navigation.actorHeight(30,-7))<1e-9);
run('const hillRock=rock(32,-7);globalThis.hillResource=resources.at(-1);hillResource.max=5;hillResource.remaining=5;syncResources();updateGrounding();updateGrounding()');
assert.ok(Math.abs(run('hillResource.g.position.y')-(.4+navigation.terrainElevation(32,-7)))<1e-9);
const hillStoneBefore=run('s.stone');
run('player.position.set(hillResource.x,actorHeight(hillResource.x,hillResource.z),hillResource.z);hillResource.cool=0;collectResource(hillResource);updateWork(3.1)');assert.equal(run('workTask'),null);assert.ok(run('s.stone')>hillStoneBefore);
// Ground clicks hit the rendered hill rather than the old y=.4 plane.
run('scene.updateMatrixWorld(true);clickRay.set(new THREE.Vector3(32,20,-7),new THREE.Vector3(0,-1,0))');
assert.ok(Math.abs(run('groundPoint().y')-(.38+navigation.terrainElevation(32,-7)))<.04);
run('s.buildings.haven=0');assert.equal(run('terrainRoots().length'),1);run('s.buildings.haven=8');assert.equal(run('terrainRoots().length'),5);
// Camera stays in front of walls, ignores hidden/translucent objects and clears near-plane corners.
const avoid=navigation.createCameraAvoidance(),center=new THREE.Vector3(0,1.5,0),wanted=new THREE.Vector3(0,1.5,10);
const obstacle=new THREE.Mesh(new THREE.BoxGeometry(4,4,1),new THREE.MeshBasicMaterial());obstacle.position.set(0,1.5,5);obstacle.updateMatrixWorld(true);
assert.ok(avoid(center,wanted,[obstacle]).z<4.2);
obstacle.visible=false;assert.equal(avoid(center,wanted,[obstacle]).z,10);obstacle.visible=true;
obstacle.material.transparent=true;obstacle.material.opacity=.22;assert.equal(avoid(center,wanted,[obstacle]).z,10);obstacle.material.opacity=1;
obstacle.position.set(2.2,1.5,5);obstacle.updateMatrixWorld(true);assert.ok(avoid(center,wanted,[obstacle]).z<4.2);
obstacle.position.set(0,1.5,15);obstacle.updateMatrixWorld(true);assert.equal(avoid(center,wanted,[obstacle]).z,10);
run('player.position.set(32,actorHeight(32,-7),-7);yaw=.65;pitch=.12;zoom=25;updateCamera(.1)');
assert.ok(run('camera.position.y')>run('terrainElevation(camera.position.x,camera.position.z)+.38'));
assert.ok(run('camera.position.toArray().every(Number.isFinite)'));
obstacle.geometry.dispose();obstacle.material.dispose();
console.log('PASS: visible hill geometry, slope continuity, actor/resource grounding without drift, hill gathering and path height, terrain clicks, region gates, wall/corner/hidden camera collisions and terrain clearance.');

run('const hillHouse=new THREE.Group();hillHouse.position.set(32,0,-7);groundBuilding(hillHouse,"house",{x:32,z:-7});globalThis.testHillHouse=hillHouse;groundRoot(hillHouse);groundRoot(hillHouse)');
assert.ok(run('testHillHouse.position.y')>=navigation.terrainElevation(32,-7));assert.ok(run('testHillHouse.children.some(o=>o.userData.foundation)'));
run('snapshotNodes();initializeNodes();syncResources()');assert.ok(run('resources.some(r=>r.x===32&&r.z===-7)'));
console.log('PASS: hill foundations and saved deposits in unlocked expansion regions survive restoration.');
run('globalThis.cameraTestWall=new THREE.Mesh(new THREE.BoxGeometry(4,4,1),new THREE.MeshBasicMaterial());cameraTestWall.position.set(70,2,66);scene.add(cameraTestWall);buildingGroups.set("qa-camera-wall",cameraTestWall);sea=false;focusPoint=null;player.position.set(70,.45,70);yaw=Math.PI;pitch=.18;zoom=12;camera.position.set(70,10,90);updateCamera(.1)');
assert.ok(run('camera.position.distanceTo(cameraCenter)')>=5);assert.ok(run('camera.position.y')>3);
run('buildingGroups.delete("qa-camera-wall");scene.remove(cameraTestWall);cameraTestWall.geometry.dispose();cameraTestWall.material.dispose()');
console.log('PASS: a close blocked camera raises its angle to preserve a comfortable character view.');
