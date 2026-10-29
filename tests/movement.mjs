import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {createMovementSystem,initPhysics} from '../dist/movement.js';
// During asynchronous WASM loading, the same safe movement and path planner remain usable.
const loading=createMovementSystem({getRegions:()=>[{x:0,z:0,r:10}],getObstacles:()=>[{id:'wall',x:0,z:0,r:2}],inside:(x,z)=>Math.hypot(x,z)<10,getTerrain:()=>[]});
assert.equal(loading.stats.physics,'loading');assert.ok(loading.move(new THREE.Vector3(-6,.45,0),12,0).x< -2.2);assert.ok(loading.findPath(new THREE.Vector3(-6,.45,0),new THREE.Vector3(6,.45,0))?.length>1);loading.dispose();
await initPhysics();await loading.ready;
let obstacles=[{id:'house',x:0,z:0,r:2}],regions=[{x:0,z:0,r:15}];
const inside=(x,z,m=0)=>Math.abs(x)+m<15&&Math.abs(z)+m<15;
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-15,.38,-15,-15,.38,15,15,.38,-15,15,.38,15],3));geometry.setIndex([0,1,2,2,1,3]);const terrain=new THREE.Mesh(geometry);
const m=createMovementSystem({getRegions:()=>regions,getObstacles:()=>obstacles,inside,getTerrain:()=>[terrain],height:()=>.45});await m.ready;
assert.equal(m.stats.physics,'ready');m.step();
const route=m.findPath(new THREE.Vector3(-6,.45,0),new THREE.Vector3(6,.45,0));assert.ok(route?.length>1);let previous=new THREE.Vector3(-6,.45,0);for(const p of route){assert.ok(m.segmentClear(previous,p));previous=p;}assert.ok(previous.distanceTo(new THREE.Vector3(6,.45,0))<.01);
const builds=m.stats.meshBuilds;m.findPath(new THREE.Vector3(-6,.45,0),new THREE.Vector3(6,.45,0));assert.equal(m.stats.meshBuilds,builds);
// A 12-unit frame must shape-cast into the building, not tunnel through its far wall.
const stopped=m.move(new THREE.Vector3(-6,.45,0),12,0);assert.ok(stopped.x< -2.2);assert.ok(stopped.x> -2.5);
// Glancing input slides along a curved wall and leaves a finite, legal position.
const sliding=m.move(new THREE.Vector3(-2.4,.45,0),.5,.6);assert.ok(sliding.z>.1);assert.ok(Math.hypot(sliding.x,sliding.z)>=2.25);
const shore=m.move(new THREE.Vector3(14,.45,8),10,0);assert.ok(shore.x<14.66);
const escaped=m.move(new THREE.Vector3(0,.45,0),3,0);assert.ok(escaped.x>2.5);
// Route following reaches its destination with the same collision controller used by residents.
let actor=new THREE.Vector3(-6,.45,0);for(const goal of route){for(let i=0;i<600&&actor.distanceTo(goal)>.04;i++){const delta=goal.clone().sub(actor);delta.y=0;const step=Math.min(.06,delta.length());delta.normalize().multiplyScalar(step);m.step();actor=m.move(actor,delta.x,delta.z);}}assert.ok(actor.distanceTo(new THREE.Vector3(6,.45,0))<.08);
obstacles=[{id:'house',x:1,z:0,r:3}];m.step();const changed=m.findPath(new THREE.Vector3(-6,.45,0),new THREE.Vector3(6,.45,0));assert.ok(changed?.length>1);assert.ok(m.stats.meshBuilds>builds);previous=new THREE.Vector3(-6,.45,0);for(const p of changed){assert.ok(m.segmentClear(previous,p));previous=p;}
obstacles=[];m.step();assert.equal(m.findPath(new THREE.Vector3(-6,.45,0),new THREE.Vector3(6,.45,0)).length,1);const removedMove=m.move(new THREE.Vector3(-6,.45,0),12,0);assert.ok(removedMove.x>5);
obstacles=[{id:'barrier',x:0,z:0,r:16}];m.step();assert.equal(m.findPath(new THREE.Vector3(-14,.45,0),new THREE.Vector3(14,.45,0)),null);
m.dispose();geometry.dispose();terrain.material.dispose();
console.log('PASS: real Rapier loading, continuous collision, sliding, coastline bounds, overlap escape, navmesh detour/cache, resident route completion, moved/removed obstacles and unreachable goals.');
// Exercise the real controller against the same gridded hill mesh used by the game.
const {createLandGeometry,actorHeight}=await import('../dist/navigation.js');
const hill=new THREE.Mesh(createLandGeometry(26,-6,16,(a,r)=>r));hill.position.y=.28;
const hills=createMovementSystem({getRegions:()=>[{x:26,z:-6,r:16}],getObstacles:()=>[],inside:(x,z,margin=0)=>Math.hypot(x-26,z+6)+margin<16,getTerrain:()=>[hill]});await hills.ready;
let climber=new THREE.Vector3(25,actorHeight(25,-7),-7);for(let i=0;i<150;i++){hills.step();climber=hills.move(climber,.05,0);}assert.ok(climber.x>31);assert.ok(climber.y>2.7);
for(let i=0;i<140;i++){hills.step();climber=hills.move(climber,-.05,0);}assert.ok(climber.x<27);assert.ok(climber.y<1.3);hills.dispose();hill.geometry.dispose();hill.material.dispose();
console.log('PASS: Rapier ascends and descends the rendered island hill without getting stuck.');
