/** Replace the complete command prefix, rather than duplicating await/robot. */
export function completionRange(text,position){
 const lineStart=text.lastIndexOf('\n',position-1)+1;
 const before=text.slice(lineStart,position);
 const match=before.match(/(?:await\s+)?(?:robot\.)?\w*$/);
 return {from:lineStart+(match?.index??before.length),to:position};
}
