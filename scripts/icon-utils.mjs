// Shared, side-effect-free validation for Pandora Saga original WebP mirroring.
// The source catalog may contain unexpected filenames; never join unchecked values into a path.
export function safeIconStem(value){
 const stem=String(value??'');
 if(!/^[A-Za-z0-9_-]{1,120}$/.test(stem))throw Error('Unsafe icon filename: '+stem.slice(0,80));
 return stem;
}
export function isWebP(buffer){
 if(!(buffer instanceof Uint8Array)||buffer.length<20)return false;
 const tag=(offset)=>String.fromCharCode(...buffer.subarray(offset,offset+4));
 if(tag(0)!=='RIFF'||tag(8)!=='WEBP')return false;
 if(!['VP8 ','VP8L','VP8X'].includes(tag(12)))return false;
 const size=(buffer[4]|buffer[5]<<8|buffer[6]<<16|buffer[7]<<24)>>>0;
 return size>=12&&size<=buffer.length-8;
}
