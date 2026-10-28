// Shared starter catalog for the 7TAC companion prototype.
// All names and weights are provisional; server-side issuance is not implemented.
export const STARTER_ARCHETYPES = Object.freeze([
  'Platform Pigeon','Fitted Cap','Compact Disc','Subway Ghost','Graffiti Can',
  'Metro Rat','Boombox','Arcade Cabinet','Payphone','Turnstile','Skate Deck',
  'Cassette','Disposable Camera','Sneaker','Streetlight Moth','Pizza Slice','CRT Monitor'
].map((name,index)=>Object.freeze({id:index+1,slug:name.toLowerCase().replace(/\s+/g,'-'),name,weight:1})));

export const MAX_INTERMEDIATE_STAGE = 3;
export const ULTIMATE_STAGE = 4;

// Prototype-only progression guard. Production must enforce this in a trusted
// database function and verify that attendance seals were actually issued.
export function canAdvanceToStage({targetStage,verifiedAttendanceSeals}){
  if(!Number.isInteger(targetStage)||targetStage<1||targetStage>ULTIMATE_STAGE)return false;
  if(targetStage===ULTIMATE_STAGE)return Number.isInteger(verifiedAttendanceSeals)&&verifiedAttendanceSeals>0;
  return true;
}

// Only for demos/tests. Do not use this for real claims, edition allocation,
// rarity weighting or payment entitlements.
export function previewStarter(index){
  return STARTER_ARCHETYPES[((index%STARTER_ARCHETYPES.length)+STARTER_ARCHETYPES.length)%STARTER_ARCHETYPES.length];
}
