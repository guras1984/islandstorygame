import * as THREE from './dist/vendor/three.module.js';
import * as rules from './dist/progression.js';
import * as hero from './dist/character.js';
import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const nodes=new Map();function node(sel){if(!nodes.has(sel))nodes.set(sel,{textContent:'',innerHTML:'',style:{},open:false,hidden:false,scrollTop:0,parentElement:{scrollTop:0},classList:{toggle(){}},setAttribute(){},querySelectorAll(){return[]},append(){},showModal(){this.open=true},close(){this.open=false}});return nodes.get(sel)}
const events={},memory=new Map(),scheduled=[];const gainParam=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
class FakeAudio {constructor(){this.sampleRate=1000;this.currentTime=1;this.state='running';this.destination={};}resume(){}createGain(){return {gain:gainParam(),connect(){},disconnect(){}}}createOscillator(){return {frequency:gainParam(),connect(){},disconnect(){},start(t){scheduled.push(t)},stop(){}}}createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)}}createBufferSource(){return {connect(){},start(){}}}createBiquadFilter(){return {frequency:gainParam(),connect(){}}}}
const ctx=vm.createContext({...rules,...hero,THREE:{...THREE,WebGLRenderer:class{constructor(){this.shadowMap={};this.domElement={setAttribute(){},focus(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:1280,height:720}}}}setPixelRatio(){}setSize(){}render(){}}},AudioContext:FakeAudio,document:{querySelector:node,querySelectorAll:()=>[],body:node('body'),activeElement:{tagName:'BODY'},addEventListener(){},hidden:false},innerWidth:1280,innerHeight:720,devicePixelRatio:1,localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},addEventListener(name,fn){(events[name]??=[]).push(fn)},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>false,location:{reload(){}},console,Math,Date});
const source=fs.readFileSync(new URL('./dist/game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);const emit=(name,event)=>events[name].forEach(fn=>fn(event));node('#welcome').open=false;
// Character creation is draft-only until confirmation and never resets the island.
assert.equal(hero.HEROES.length,1);assert.equal(run('player.userData.heroId'),'jun');
run('s.wood=17;openAvatarEditor();customizeHero("shirt","leaf");customizeHero("hat","tangerine")');
assert.equal(run('s.appearance.shirt'),'ocean');assert.equal(run('heroPreview.model.userData.appearance.shirt'),'leaf');
run('customizeHero("hat","invalid")');assert.equal(run('avatarDraft.hat'),'tangerine');run('confirmHero()');
assert.equal(run('s.wood'),17);assert.equal(run('s.characterChosen'),true);assert.equal(run('player.userData.appearance.hat'),'tangerine');assert.equal(run('player.userData.rig.wings.length'),2);assert.equal(rules.normalize(JSON.parse(memory.get('island-nation-v1'))).appearance.shirt,'leaf');run('s.wood=0');
// Pinch zoom changes distance only, then suppresses stray taps until all fingers lift.
run('zoom=20;setMoveTarget(new THREE.Vector3(2,0,2));');const initialYaw=run('yaw');
const touch=(id,x,y)=>({button:0,pointerType:'touch',pointerId:id,clientX:x,clientY:y});
ctx.touch1=touch(101,100,100);ctx.touch2=touch(102,200,100);ctx.touch2wide=touch(102,300,100);
run('renderer.domElement.onpointerdown(touch1);renderer.domElement.onpointerdown(touch2);renderer.domElement.onpointermove(touch2wide)');assert.equal(run('zoom'),10);assert.equal(run('yaw'),initialYaw);assert.equal(run('moveTarget'),null);
run('renderer.domElement.onpointerup(touch2wide);renderer.domElement.onpointermove({...touch1,clientX:160});renderer.domElement.onpointerup({...touch1,clientX:160})');assert.equal(run('yaw'),initialYaw);assert.equal(run('moveTarget'),null);assert.equal(run('gesturePointers.size'),0);
run('setZoom(.1)');assert.equal(run('zoom'),4.5);run('setZoom(200)');assert.equal(run('zoom'),80);run('zoom=25;renderer.domElement.onwheel({deltaY:-100,preventDefault(){}})');assert.ok(run('zoom')<25);
// HUD folding is independent, persisted separately from progress, and closes an open management panel.
run('toggleHud("quest")');assert.equal(run('hudFolded.quest'),true);assert.equal(JSON.parse(memory.get('isletopia-hud-v1')).quest,true);
run('toggleHud("resources");toggleHud("quest")');assert.equal(run('hudFolded.resources'),true);assert.equal(run('hudFolded.quest'),false);
run('panelOpen=true;toggleHud("nav")');assert.equal(run('panelOpen'),false);assert.equal(run('hudFolded.nav'),true);run('toggleHud("nav");toggleHud("resources")');
// Floating touch stick appears only during a deliberate drag, never rotates the camera.
run('resetGesture();clearKeys();cancelMove();player.position.set(0,.45,0)');
ctx.stickDown=touch(201,100,550);ctx.stickMove=touch(201,143,550);
run('renderer.domElement.onpointerdown(stickDown)');assert.equal(node('#floatingJoystick').hidden,true);
const stickYaw=run('yaw');run('renderer.domElement.onpointermove({...stickDown,clientX:106.5})');assert.equal(run('yaw'),stickYaw);
run('renderer.domElement.onpointermove(stickMove)');assert.equal(node('#floatingJoystick').hidden,false);assert.equal(run('joystick.active'),true);
const stickPosition=run('player.position.clone()');run('update(.2)');assert.ok(stickPosition.distanceTo(run('player.position.clone()'))>.7);assert.equal(run('yaw'),stickYaw);
run('renderer.domElement.onpointerup(stickMove)');assert.equal(node('#floatingJoystick').hidden,true);assert.equal(run('moveTarget'),null);
const releasedPosition=run('player.position.clone()');run('update(.2)');assert.ok(releasedPosition.distanceTo(run('player.position.clone()'))<.001);
run('renderer.domElement.onpointerdown(stickDown);renderer.domElement.onpointermove(stickMove);renderer.domElement.onpointerdown(touch2)');assert.equal(node('#floatingJoystick').hidden,true);assert.equal(run('joystick'),null);
run('renderer.domElement.onpointerup(touch2);renderer.domElement.onpointerup(stickMove)');assert.equal(run('moveTarget'),null);
// Compact rows defer all descriptions to one native details dialog.
const row=run('buildingCard(defs.find(d=>d.id==="habitat"))');assert.ok(!row.includes('토끼가 안심'));assert.ok(row.includes('자세히'));assert.ok(run('compactPanel()').includes('앞으로 열릴 건물'));
run('showDetails("building","habitat")');assert.ok(node('#detailBody').innerHTML.includes('토끼가 안심'));assert.equal(node('#detailDialog').open,true);node('#detailDialog').close();
// Korean keyboard, animation and click movement regressions.
for(const [code,key]of [['KeyW','ㅈ'],['KeyA','ㅁ'],['KeyS','ㄴ'],['KeyD','ㅇ'],['ArrowUp','ArrowUp']]){const before=run('player.position.clone()');emit('keydown',{code,key,preventDefault(){}});run('update(.2)');assert.ok(before.distanceTo(run('player.position.clone()'))>.5);emit('keyup',{code,key:'Process'});const p=run('player.position.clone()');run('update(.1)');assert.ok(p.distanceTo(run('player.position.clone()'))<.01);}
run('animateHuman(player,.1,.4)');assert.ok(run('player.userData.rig.leftLeg.rotation.x*player.userData.rig.rightLeg.rotation.x')<0);for(let i=0;i<30;i++)run('animateHuman(player,.05,0)');assert.ok(Math.abs(run('player.userData.rig.leftLeg.rotation.x'))<.001);
run('clearKeys();player.position.set(0,.45,0);setMoveTarget(new THREE.Vector3(4,0,3))');for(let i=0;i<100;i++)run('update(.03)');assert.ok(run('Math.hypot(player.position.x-4,player.position.z-3)')<.04);assert.equal(run('moveTarget'),null);assert.equal(run('setMoveTarget(new THREE.Vector3(30,0,0))'),false);
run('setMoveTarget(new THREE.Vector3(-4,0,0))');emit('keydown',{code:'KeyD',key:'ㅇ',preventDefault(){}});assert.equal(run('moveTarget'),null);emit('keyup',{code:'KeyD'});
run('setMoveTarget(new THREE.Vector3(2,0,2));renderer.domElement.onpointerdown({button:0,clientX:100,clientY:100,pointerId:1});renderer.domElement.onpointermove({clientX:125,clientY:100,pointerId:1});renderer.domElement.onpointerup({clientX:125,clientY:100,pointerId:1});');assert.equal(run('moveTarget'),null);
// Selecting a resource walks into range and harvests only once.
run('cancelMove();player.position.set(0,.45,0);harvestCD=0;resources[0].cool=0');const gatherBefore=run('s[resources[0].type]');
run('activateTarget({kind:"resource",ref:resources[0]})');assert.equal(node('#contextActions').hidden,true);
for(let i=0;i<600;i++)run('update(.03)');assert.equal(run('s[resources[0].type]'),gatherBefore+run('resources[0].type==="wood"?4:3'));assert.equal(run('pendingAction'),null);
assert.ok(run('menuBounds(389,840,162,190,390,844).left')<=218);assert.ok(run('menuBounds(0,0,162,190,390,844).top')>=10);
// Construction previews never spend, cancellation is reversible, upgrades gate progression.
run('s.wood=100000;s.stone=100000;s.food=100000;s.gold=100000;s.crystal=100;');const wood=run('s.wood');run('build("habitat")');assert.ok(run('placement'));assert.equal(run('s.wood'),wood);const previewPos=run('({x:placement.x,z:placement.z})');run('renderer.domElement.onpointerdown(touch1);renderer.domElement.onpointerdown(touch2);renderer.domElement.onpointermove(touch2wide);renderer.domElement.onpointerup(touch2wide);renderer.domElement.onpointerup(touch1)');assert.equal(run('placement.x'),previewPos.x);assert.equal(run('placement.z'),previewPos.z);run('cancelPlacement()');assert.equal(run('s.wood'),wood);
function findSpot(id,skip=null){return run(`(()=>{const d=defs.find(d=>d.id===${JSON.stringify(id)});const pts=[];for(let x=-21;x<=21;x+=1.5)for(let z=-21;z<=21;z+=1.5)if(validPlacement(d.id,x,z,${JSON.stringify(skip)}))pts.push({x,z,dist:Math.hypot(x-d.origin[0],z-d.origin[1])});pts.sort((a,b)=>a.dist-b.dist);return pts[0]})()`);}
function place(id){run(`build('${id}')`);assert.ok(run('placement'),id+' preview');assert.equal(run('panelOpen'),false);const p=id==='dock'?{x:0,z:24}:findSpot(id);assert.ok(p,id+' has room');run(`placement.x=${p.x};placement.z=${p.z};refreshGhost()`);assert.equal(run('commitPlacement()'),true,id+' placed');run('closeDialogue();dialogueCooldown=0');}
run('build("house")');assert.equal(run('placement'),null);
for(const id of ['habitat','orchard','pond','farm','house','lumber','quarry','store','cottages','warehouse','plaza','council','dock']){
 place(id);assert.equal(run(`level(s,'${id}')`),1);const scale=run(`buildingGroups.get('${id}').scale.y`);assert.equal(run(`upgrade('${id}')`),true);assert.ok(run(`buildingGroups.get('${id}').scale.y`)>scale);run('closeDialogue()');
 if(id==='habitat'){assert.equal(run('animals.length'),5);const n=run('animals.length');run('rebuildNature();rebuildNature()');assert.equal(run('animals.length'),n);}
 if(id==='house'){assert.equal(run('crew()'),0);assert.ok(run('s.visitor'));run('talkTo(visitorMesh);skipDialogue()');assert.equal(run('crew()'),0);assert.ok(run('dialogue.choices.length')===2);run('chooseDialogue(0)');assert.equal(run('crew()'),1);assert.equal(run('capacity(s)'),4);}
}
assert.equal(run('voyageUnlocked()'),true);assert.equal(run('validPlacement("house",0,0,"habitat")&&validPlacement("house",100,0)'),false);
run('activateTarget({kind:"building",id:"house"})');assert.ok(node('#contextChoices').innerHTML.includes('업그레이드'));run('cancelMove()');assert.equal(node('#contextActions').hidden,true);
// More homes expand capacity, visitors need explicit consent, resident assignments persist.
const count=run('crew()'),cap=run('capacity(s)');run('startPlacement("house","extra")');const homeSpot=findSpot('house');assert.ok(homeSpot);run(`placement.x=${homeSpot.x};placement.z=${homeSpot.z};commitPlacement()`);assert.equal(run('capacity(s)'),cap+2);assert.equal(run('crew()'),count);run('talkTo(visitorMesh);skipDialogue();chooseDialogue(1)');assert.equal(run('crew()'),count);run('maybeVisitor(45);acceptVisitor()');assert.equal(run('crew()'),count+1);run('assignResident(s.residents[0].id,"wood")');assert.equal(run('s.jobs.wood'),1);let before=run('s.wood');run('produce()');assert.ok(run('s.wood')>before);
// Relocation and heading are persisted without spending resources.
run('startPlacement("habitat","move")');const moved=findSpot('habitat','habitat');run(`placement.x=${moved.x};placement.z=${moved.z};rotatePlacement()`);before=run('s.wood');assert.equal(run('commitPlacement()'),true);assert.equal(run('s.wood'),before);assert.equal(run('s.placements.habitat.rotation'),Math.PI/2);
// Events reward only once, weather-specific gathering is optional, decor appears.
run('takeEvent("supplies")');before=run('s.gold');assert.equal(run('claimEvent("supplies")'),false);run('s.totals.wood+=20');assert.equal(run('claimEvent("supplies")'),true);assert.equal(run('s.gold'),before+18);assert.equal(run('claimEvent("supplies")'),false);
run('changeWeather("rain");takeEvent("rain");changeWeather("clear")');assert.ok(run('s.mushrooms.length')>=3);assert.ok(run('s.afterRain')>0);for(let i=0;i<3;i++)run('player.position.set(s.mushrooms.find(p=>!p.collected).x,.45,s.mushrooms.find(p=>!p.collected).z);collectMushroom()');assert.equal(run('claimEvent("rain")'),true);assert.ok(run('s.decorations.includes("버섯 정원")'));
run('s.time=23*50;updateWorld(.01)');assert.ok(run('sun.intensity')<1);assert.equal(run('stars.visible'),true);run('s.time=12*50;updateWorld(.01)');assert.ok(run('sun.intensity')>2);assert.equal(run('stars.visible'),false);
// Planting and aging produces actual birds, repeated refreshes do not duplicate them.
const treeSpot=run('(()=>{for(let x=-19;x<20;x+=2)for(let z=-19;z<20;z+=2)if(validPlacement("sapling",x,z))return {x,z};})()');assert.ok(treeSpot);run('startPlacement("sapling","plant")');run(`placement.x=${treeSpot.x};placement.z=${treeSpot.z};commitPlacement()`);const animals=run('animalCount()');run('s.saplings[0].age=35;rebuildNature()');assert.equal(run('animalCount()'),animals+1);run('rebuildNature()');assert.equal(run('animalCount()'),animals+1);
// Audio schedules generated notes, volume and mute control the master.
run('toggleMusic();updateAudio()');assert.ok(scheduled.length>0);assert.equal(run('audioReady'),true);assert.equal(run('s.audioOn'),true);run('s.volume=.1;setVolume();toggleMusic()');assert.equal(run('s.audioOn'),false);
// Midgame sailing/combat survives the new building levels and housing rules.
run('build("boat");sail();boat.position.copy(monsters[0].g.position)');assert.equal(run('sea'),true);for(let i=0;i<4;i++)run('attackCD=0;attack()');assert.equal(run('s.kills'),1);run('boat.position.set(islands[0].x+8,0,islands[0].z);update(.016)');assert.equal(run('s.discovered.includes(0)'),true);run('colonize(0)');assert.equal(run('s.colonies.length'),1);assert.equal(run('crew()'),count+1);run('sail();upgrade("dock");upgrade("boat");build("ship")');assert.equal(run('level(s,"ship")'),1);
run('save()');const saved=JSON.parse(memory.get('island-nation-v1'));assert.equal(saved.residents.length,count+1);assert.equal(saved.placements.habitat.rotation,Math.PI/2);const restored=rules.normalize(saved);assert.equal(restored.jobs.wood,1);assert.equal(restored.decorations.length,saved.decorations.length);
const legacy=rules.normalize({buildings:{house:true,cottages:true,council:true,boat:true,dock2:true},jobs:{wood:2,stone:1},colonies:[]});assert.equal(legacy.residents.length,9);assert.ok(rules.capacity(legacy)>=9);assert.equal(legacy.buildings.dock,2);assert.equal(legacy.jobs.wood,2);
if(process.argv.includes('--fixture'))fs.writeFileSync('/private/tmp/island-qa-fixture.json',JSON.stringify({...saved,time:18.5*50,weather:'rain',weatherLeft:60,visitor:{...rules.PROFILES[3],name:'유나',id:50},wood:200,stone:150,food:200,gold:100,audioOn:false,started:true}));
console.log('PASS: hero creation/color preview/save; pinch zoom limits/gesture isolation; compact menus/details; Korean keyboard and click movement; walking/harvesting; 13 placeable buildings and three-level gating; previews/cancel/rotation/move; upgrade appearance; housing capacity and visitor permission/decline; work assignment/production; event reward idempotence; rain/mushrooms/decor; day/night lighting; tree nesting; music scheduling/mute; sailing/combat/settlement; save migration.');
