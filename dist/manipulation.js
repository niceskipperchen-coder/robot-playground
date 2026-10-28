export {BlockWorld} from './physics.js';
/** Simplified parallel-jaw attachment: alignment tolerance in millimetres. */
export function grasp(objects, tool) {
  const candidates=objects.filter(o=>!objects.some(other=>other.id!==o.id && other.z>o.z+o.size*.65 && Math.abs(other.x-o.x)<o.size*.8 && Math.abs(other.y-o.y)<o.size*.8) && Math.hypot(o.x-tool.x,o.y-tool.y)<=8 && Math.abs(o.z-tool.z)<=6);
  candidates.sort((a,b)=>Math.hypot(a.x-tool.x,a.y-tool.y,a.z-tool.z)-Math.hypot(b.x-tool.x,b.y-tool.y,b.z-tool.z));
  return candidates[0]?.id ?? null;
}
