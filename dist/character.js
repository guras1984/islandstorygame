import * as THREE from './vendor/three.module.js';
// Add future protagonists and wearable shapes here; saves reference stable IDs.
export const HEROES=[{id:'jun',name:'준이',description:'아이의 그림에서 태어난, 작은 섬의 첫 개척자'}];
export const SHIRTS={ocean:{name:'바다 파랑',color:'#547e8d'},leaf:{name:'숲 초록',color:'#78966a'}};
export const HATS={sun:{name:'햇살 노랑',color:'#efc34f'},tangerine:{name:'노을 주황',color:'#e9944d'}};
export function createHero({box,orb,cyl},appearance={}){
const g=new THREE.Group(),body=new THREE.Group();g.add(body);g.userData.heroId='jun';
const shirt=SHIRTS[appearance.shirt]||SHIRTS.ocean,hat=HATS[appearance.hat]||HATS.sun;
const torso=box(.98,1.04,.57,shirt.color,0,1.12,0,body);torso.userData.part='shirt';
box(1,.15,.6,'#cf7e42',0,.64,0,body);box(1,.035,.61,'#e6c263',0,.74,0,body);
box(1.05,.76,.64,'#e8b086',0,2.03,0,body);
// A small, friendly face rather than a generic human head.
orb(.06,.065,.045,'#423e32',-.24,2.08,.33,body);orb(.06,.065,.045,'#423e32',.24,2.08,.33,body);
const nose=cyl(.065,0,.11,'#d78343',0,1.99,.365,body,3);nose.rotation.x=Math.PI/2;
const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.15,1.96,.34),new THREE.Vector3(-.08,1.91,.35),new THREE.Vector3(0,1.96,.35),new THREE.Vector3(.08,1.91,.35),new THREE.Vector3(.15,1.96,.34)]);
const mouth=new THREE.Mesh(new THREE.TubeGeometry(smile,20,.013,6,false),new THREE.MeshStandardMaterial({color:'#514334',roughness:1}));body.add(mouth);
for(const angle of [-.78,.78]){const x=box(.085,.53,.035,'#f2cd4d',0,1.15,.307,body);x.rotation.z=angle;}
function limb(x,y,w,h,d,color){const pivot=new THREE.Group();pivot.position.set(x,y,0);body.add(pivot);box(w,h,d,color,0,-h/2,0,pivot);return pivot;}
const leftLeg=limb(-.25,.6,.28,.5,.32,shirt.color),rightLeg=limb(.25,.6,.28,.5,.32,shirt.color);
for(const leg of [leftLeg,rightLeg])box(.32,.16,.43,'#cf7e42',0,-.47,.06,leg);
const leftArm=limb(-.65,1.47,.24,.61,.34,shirt.color),rightArm=limb(.65,1.47,.24,.61,.34,shirt.color);
for(const arm of [leftArm,rightArm]){box(.27,.18,.37,'#d58b4c',0,-.48,0,arm);orb(.11,.14,.11,'#e8b086',0,-.66,0,arm);}
const wings=[];for(const sign of [-1,1]){const wing=new THREE.Group();wing.position.set(sign*.5,1.48,-.26);body.add(wing);for(let i=0;i<3;i++){const feather=box(.3,.84-i*.14,.12,'#547987',sign*(.25+i*.13),.22-i*.18,0,wing);feather.rotation.z=-sign*.6;const stripe=box(.08,.7-i*.14,.025,'#e9bf5e',sign*(.25+i*.13),.22-i*.18,.08,wing);stripe.rotation.z=-sign*.6;}wings.push(wing);}
const headwear=new THREE.Group();headwear.position.set(0,2.41,0);body.add(headwear);headwear.userData.part='hat';
// Keep the uneven three peaks of the child's original crown.
const shape=new THREE.Shape();shape.moveTo(-.48,0);shape.lineTo(-.51,.45);shape.lineTo(-.24,.28);shape.lineTo(-.14,.67);shape.lineTo(.06,.32);shape.lineTo(.26,.6);shape.lineTo(.37,0);shape.closePath();
const crownMat=new THREE.MeshStandardMaterial({color:hat.color,roughness:.92});const crown=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.02}),crownMat);crown.position.set(-.04,0,.15);crown.rotation.z=.08;headwear.add(crown);crown.castShadow=true;
box(.9,.13,.57,'#e7c783',-.04,.035,0,headwear);for(let i=0;i<5;i++)orb(.035,.04,.025,'#748c8d',-.4+i*.17,.035,.3,headwear);
const cone=cyl(0,.19,.6,hat.color,.37,.3,-.03,headwear,20);cone.rotation.z=-.2;const stripe=cyl(.1,.14,.12,shirt.color,.36,.23,-.03,headwear,20);stripe.rotation.z=-.2;
orb(.14,.085,.055,shirt.color,.48,.02,.27,headwear);orb(.14,.085,.055,shirt.color,.69,.02,.27,headwear);
g.userData.rig={body,leftLeg,rightLeg,leftArm,rightArm,wings,phase:0,blend:0,action:0};g.userData.appearance={character:'jun',shirt:appearance.shirt in SHIRTS?appearance.shirt:'ocean',hat:appearance.hat in HATS?appearance.hat:'sun'};return g;
}
