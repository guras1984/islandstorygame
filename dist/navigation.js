import * as THREE from './vendor/three.module.js';

// Original terrain; the existing central settlement and waterfront stay level.
const hills=[{x:32,z:-7,r:8,h:2.6},{x:0,z:-34,r:9,h:1.6},{x:-30,z:-28,r:9,h:1.2}];
export function terrainElevation(x,z){
  let height=0;
  for(const hill of hills){const q=((x-hill.x)**2+(z-hill.z)**2)/hill.r**2;if(q<1)height+=hill.h*(1-q)**3;}
  return height;
}
export function actorHeight(x,z){return .45+terrainElevation(x,z);}

export function createLandGeometry(x,z,r,shoreRadius){
  const segments=96,rings=Math.ceil(r*2),positions=[0,.1+terrainElevation(x,z),0],indices=[];
  for(let ring=1;ring<=rings;ring++)for(let i=0;i<segments;i++){
    const angle=i/segments*Math.PI*2,d=shoreRadius(angle,r)*ring/rings;
    const px=Math.sin(angle)*d,pz=Math.cos(angle)*d;
    positions.push(px,.1+terrainElevation(x+px,z+pz),pz);
  }
  for(let i=0;i<segments;i++)indices.push(0,1+i,1+(i+1)%segments);
  for(let ring=1;ring<rings;ring++)for(let i=0;i<segments;i++){
    const a=1+(ring-1)*segments+i,b=1+(ring-1)*segments+(i+1)%segments,c=a+segments,d=b+segments;
    indices.push(a,c,b,b,c,d);
  }
  // A short skirt preserves the grass edge above the existing sand layer.
  const bottom=positions.length/3,edge=1+(rings-1)*segments;
  for(let i=0;i<segments;i++)positions.push(positions[(edge+i)*3],-.1,positions[(edge+i)*3+2]);
  for(let i=0;i<segments;i++){const j=(i+1)%segments;indices.push(edge+i,bottom+i,edge+j,edge+j,bottom+i,bottom+j);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

// Sweep a small camera envelope, rather than a single ray which can clip at corners.
export function createCameraAvoidance(){
  const ray=new THREE.Raycaster(),direction=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),origin=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0);
  const offsets=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
  function visibleSolid(hit){
    for(let o=hit.object;o;o=o.parent)if(!o.visible||o.userData.cameraIgnore)return false;
    const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
    const m=materials[hit.face?.materialIndex||0];return m&&(!m.transparent||m.opacity>=.8);
  }
  return function avoid(center,wanted,objects,out=new THREE.Vector3()){
    direction.copy(wanted).sub(center);const distance=direction.length();if(distance<.001)return out.copy(center);direction.divideScalar(distance);
    right.crossVectors(direction,worldUp).normalize();if(right.lengthSq()<.001)right.set(1,0,0);up.crossVectors(right,direction).normalize();
    let safe=distance;
    for(const [x,y]of offsets){origin.copy(center).addScaledVector(right,x*.28).addScaledVector(up,y*.28);ray.set(origin,direction);ray.near=0;ray.far=distance+.35;
      const hit=ray.intersectObjects(objects,true).find(visibleSolid);if(hit)safe=Math.min(safe,Math.max(0,hit.distance-.4));
    }
    return out.copy(center).addScaledVector(direction,safe);
  };
}
