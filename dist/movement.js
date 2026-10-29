import * as THREE from './vendor/three.module.js';
import {Pathfinding} from './vendor/three-pathfinding-1.3.0.js';
import {actorHeight} from './navigation.js?v=18';

const RADIUS=.25,SKIN=.035,ZONE='island',CELL=1;
let rapier=null,initializing=null;
export function initPhysics(){
  if(!initializing)initializing=import('./vendor/rapier-0.21.0.mjs').then(async({default:R})=>{await R.init();rapier=R;return R;});
  return initializing;
}

// Terrain and obstacles are supplied by the game, keeping save data independent of either engine.
export function createMovementSystem({getRegions,getObstacles,inside,height=actorHeight,getTerrain}){
  let obstacles=[],signature='',meshSignature='',pathfinder=null,world=null,controller=null,character=null,groundKey='',ground=[],walls=[],disposed=false;
  const stats={physics:'loading',meshBuilds:0,pathQueries:0};
  const blocked=(x,z,margin=RADIUS+SKIN)=>obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+margin);
  const valid=(x,z)=>inside(x,z,.35)&&!blocked(x,z);
  function segment(a,b){
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(length/.15));
    const escaping=obstacles.filter(o=>Math.hypot(a.x-o.x,a.z-o.z)<o.r+RADIUS+SKIN&&(a.x-o.x)*dx+(a.z-o.z)*dz>=-1e-7);
    for(let i=1;i<=steps;i++){const x=a.x+dx*i/steps,z=a.z+dz*i/steps;if(!inside(x,z,.35)||obstacles.some(o=>!escaping.includes(o)&&Math.hypot(x-o.x,z-o.z)<o.r+RADIUS+SKIN))return false;}
    return true;
  }
  function rebuildWalls(){
    if(!world)return;
    for(const c of walls)world.removeCollider(c,true);walls=[];
    for(const o of obstacles)walls.push(world.createCollider(rapier.ColliderDesc.cylinder(2,o.r).setTranslation(o.x,height(o.x,o.z)+2,o.z).setCollisionGroups(0x00010002)));
  }
  function sync(){
    if(disposed)return;
    const regions=getRegions(),next=getObstacles();
    const key=JSON.stringify([regions.map(r=>[r.x,r.z,r.r]),next.map(o=>[o.id,o.x,o.z,o.r])]);
    if(key!==signature){obstacles=next;signature=key;rebuildWalls();}
    const terrainKey=JSON.stringify(regions.map(r=>[r.x,r.z,r.r]));
    if(world&&terrainKey!==groundKey){
      groundKey=terrainKey;for(const c of ground)world.removeCollider(c,true);ground=[];
      for(const root of getTerrain()){
        root.updateWorldMatrix(true,true);
        root.traverse(o=>{if(!o.isMesh||o.geometry.type!=='BufferGeometry')return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld),positions=geometry.attributes.position;
          const vertices=new Float32Array(positions.array),indices=geometry.index?new Uint32Array(geometry.index.array):Uint32Array.from({length:positions.count},(_,i)=>i);
          ground.push(world.createCollider(rapier.ColliderDesc.trimesh(vertices,indices,rapier.TriMeshFlags.FIX_INTERNAL_EDGES).setCollisionGroups(0x00010002)));geometry.dispose();
        });
      }
    }
  }
  function prepare(){
    world=new rapier.World({x:0,y:-9.81,z:0});controller=world.createCharacterController(.02);controller.enableAutostep(.3,.2,false);controller.enableSnapToGround(.25);controller.setMaxSlopeClimbAngle(Math.PI/4);controller.setMinSlopeSlideAngle(Math.PI/3);
    character=world.createCollider(rapier.ColliderDesc.capsule(.45,RADIUS).setCollisionGroups(0x00020001));rebuildWalls();sync();world.step();stats.physics='ready';
  }
  const api={stats,sync,walkable(x,z){sync();return valid(x,z);},segmentClear(a,b){sync();return segment(a,b);},step(){sync();if(world)world.step();},findPath,move,dispose(){disposed=true;world?.free();world=null;pathfinder=null;}};
  if(rapier){sync();prepare();api.ready=Promise.resolve();}
  else api.ready=initPhysics().then(()=>{if(!disposed)prepare();}).catch(error=>{stats.physics='fallback';console.warn('물리 엔진을 불러오지 못해 기본 이동을 사용합니다.',error);});
  function move(position,dx,dz){
    sync();if(!Number.isFinite(dx)||!Number.isFinite(dz))return position.clone();
    const start={x:position.x,z:position.z},desired={x:position.x+dx,z:position.z+dz};
    let next;
    if(world){
      character.setTranslation({x:position.x,y:height(position.x,position.z)+.7,z:position.z});
      const escapes=new Set();for(let i=0;i<obstacles.length;i++){const o=obstacles[i];if(Math.hypot(start.x-o.x,start.z-o.z)<o.r+RADIUS+SKIN&&(start.x-o.x)*dx+(start.z-o.z)*dz>=-1e-7)escapes.add(walls[i].handle);}
      controller.computeColliderMovement(character,{x:dx,y:height(desired.x,desired.z)-height(start.x,start.z)-.12,z:dz},undefined,0x00020001,c=>!escapes.has(c.handle));
      const corrected=controller.computedMovement();next={x:position.x+corrected.x,z:position.z+corrected.z};
      // Coastlines and locked regions remain gameplay boundaries even without collider walls.
      if(!segment(start,next))next=null;
    }
    if(!next){
      let p={...start};const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
      for(let i=0;i<count;i++){const full={x:p.x+dx/count,z:p.z+dz/count};if(segment(p,full))p=full;else{const x={x:p.x+dx/count,z:p.z};if(segment(p,x))p=x;const z={x:p.x,z:p.z+dz/count};if(segment(p,z))p=z;}}
      next=p;
    }
    return new THREE.Vector3(next.x,height(next.x,next.z),next.z);
  }
  function buildMesh(){
    if(meshSignature===signature&&pathfinder)return;
    const regions=getRegions(),minX=Math.floor(Math.min(...regions.map(r=>r.x-r.r*1.15))),maxX=Math.ceil(Math.max(...regions.map(r=>r.x+r.r*1.15))),minZ=Math.floor(Math.min(...regions.map(r=>r.z-r.r*1.15))),maxZ=Math.ceil(Math.max(...regions.map(r=>r.z+r.r*1.15)));
    const positions=[],indices=[],vertices=new Map(),samples=new Map();
    const safe=(x,z)=>{const key=x+','+z;if(!samples.has(key))samples.set(key,valid(x,z));return samples.get(key);};
    const vertex=(x,z)=>{const key=x+','+z;if(!vertices.has(key)){vertices.set(key,positions.length/3);positions.push(x,0,z);}return vertices.get(key);};
    for(let x=minX;x<maxX;x+=CELL)for(let z=minZ;z<maxZ;z+=CELL){
      if(![[x,z],[x+CELL,z],[x,z+CELL],[x+CELL,z+CELL],[x+.5,z],[x,z+.5],[x+1,z+.5],[x+.5,z+1],[x+.5,z+.5]].every(([x,z])=>safe(x,z)))continue;
      const a=vertex(x,z),b=vertex(x+CELL,z),c=vertex(x,z+CELL),d=vertex(x+CELL,z+CELL);indices.push(a,c,b,b,c,d);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
    pathfinder=new Pathfinding();pathfinder.setZoneData(ZONE,Pathfinding.createZone(geometry));geometry.dispose();meshSignature=signature;stats.meshBuilds++;
  }
  function snap(point,group=null){
    const p=new THREE.Vector3(point.x,0,point.z),zone=pathfinder.zones[ZONE];
    if(!zone?.groups.length)return null;
    let best=null,bestD=Infinity;
    for(let i=0;i<zone.groups.length;i++){
      if(group!==null&&i!==group)continue;
      const within=pathfinder.getClosestNode(p,ZONE,i,true);if(within&&valid(p.x,p.z))return {point:p,group:i};
      const node=pathfinder.getClosestNode(p,ZONE,i,false);if(!node)continue;const d=node.centroid.distanceToSquared(p);
      if(d<bestD&&d<=9&&segment(point,node.centroid)){bestD=d;best={point:node.centroid.clone(),group:i};}
    }
    return best;
  }
  function findPath(from,to){
    sync();stats.pathQueries++;
    if(!inside(to.x,to.z,.15))return null;
    if(segment(from,to)&&valid(to.x,to.z))return [new THREE.Vector3(to.x,height(to.x,to.z),to.z)];
    buildMesh();const start=snap(from);if(!start)return null;const end=snap(to,start.group);if(!end)return null;
    const path=pathfinder.findPath(start.point,end.point,ZONE,start.group);if(!path)return null;
    const raw=[start.point,...path];if(valid(to.x,to.z)&&segment(raw.at(-1),to))raw.push(new THREE.Vector3(to.x,0,to.z));
    // Never accept the library's partial path as arrival; every segment must stay on open land.
    const result=[];let previous=from;
    for(const p of raw){if(Math.hypot(p.x-previous.x,p.z-previous.z)<.04)continue;if(!segment(previous,p))return null;result.push(new THREE.Vector3(p.x,height(p.x,p.z),p.z));previous=p;}
    if(Math.hypot(previous.x-end.point.x,previous.z-end.point.z)>.1)return null;
    return result.length?result:null;
  }
  return api;
}
