export class ScriptError extends Error {
  constructor(message,line=1){super(message);this.name='ScriptError';this.line=line;}
}
const arity={moveTo:3,lowerTo:1,liftTo:1,grip:0,release:0,wait:1,home:0,log:1};
/** Parse a bounded command language, never JavaScript evaluation. */
export function compile(source){
  if(typeof source!=='string'||new TextEncoder().encode(source).length>8000)throw new ScriptError('Program exceeds 8 KB.');
  const tokens=[];let pos=0,line=1;
  const consume=n=>{const value=source.slice(pos,pos+n);line+=(value.match(/\n/g)||[]).length;pos+=n;return value;};
  while(pos<source.length){
    const tail=source.slice(pos),startLine=line;
    const whitespace=tail.match(/^\s+/);if(whitespace){consume(whitespace[0].length);continue;}
    if(tail.startsWith('//')){consume(tail.indexOf('\n')<0?tail.length:tail.indexOf('\n'));continue;}
    if(tail.startsWith('/*')){const end=tail.indexOf('*/');if(end<0)throw new ScriptError('Unclosed comment.',line);consume(end+2);continue;}
    if(tail[0]==='"'||tail[0]==="'"){
      const quote=consume(1);let value='',closed=false;
      while(pos<source.length){const ch=consume(1);if(ch===quote){closed=true;break;}if(ch==='\n')throw new ScriptError('String cannot span lines.',startLine);if(ch==='\\'){const escape=consume(1);const map={n:'\n',t:'\t',r:'\r',"'":"'",'"':'"','\\':'\\'};if(!(escape in map))throw new ScriptError('Unsupported string escape.',startLine);value+=map[escape];}else value+=ch;}
      if(!closed)throw new ScriptError('Unclosed string.',startLine);tokens.push({type:'string',value,line:startLine});continue;
    }
    const number=tail.match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if(number){const value=Number(consume(number[0].length));if(!Number.isFinite(value))throw new ScriptError('Numbers must be finite.',line);tokens.push({type:'number',value,line:startLine});continue;}
    const name=tail.match(/^[A-Za-z_][A-Za-z_0-9]*/);if(name){tokens.push({type:'name',value:consume(name[0].length),line:startLine});continue;}
    if('.(),;{}'.includes(tail[0])){tokens.push({type:'punct',value:consume(1),line:startLine});continue;}
    throw new ScriptError('Unexpected character: '+tail[0],line);
  }
  let cursor=0;
  const peek=()=>tokens[cursor];
  const take=value=>{const t=tokens[cursor++];if(!t||t.value!==value)throw new ScriptError('Expected '+value+'.',t?.line??line);return t;};
  function block(depth=0){
    if(depth>4)throw new ScriptError('Repeat nesting is limited to four levels.',peek()?.line);
    const result=[];
    while(peek()&&peek().value!=='}'){
      if(peek().value==='repeat'){
        const token=take('repeat');take('(');const count=tokens[cursor++];if(count?.type!=='number'||!Number.isInteger(count.value)||count.value<1||count.value>20)throw new ScriptError('repeat count must be an integer from 1 to 20.',token.line);
        take(')');take('{');const body=block(depth+1);take('}');for(let n=0;n<count.value;n++){result.push(...body);if(result.length>300)throw new ScriptError('Program exceeds 300 expanded commands.',token.line);}continue;
      }
      const start=peek();if(start.value==='await')take('await');take('robot');take('.');const method=tokens[cursor++];
      if(method?.type!=='name'||!Object.hasOwn(arity,method.value))throw new ScriptError('Unknown robot command: '+(method?.value??''),start.line);
      take('(');const args=[];if(peek()?.value!==')'){while(true){const arg=tokens[cursor++];if(!arg||!['number','string'].includes(arg.type))throw new ScriptError('Use literal numbers or a quoted log message.',arg?.line??start.line);args.push(arg.value);if(peek()?.value!==',')break;take(',');}}
      take(')');take(';');
      if(args.length!==arity[method.value])throw new ScriptError(method.value+' expects '+arity[method.value]+' arguments.',start.line);
      if(method.value==='log'?(typeof args[0]!=='string'||args[0].length>200):args.some(a=>typeof a!=='number'))throw new ScriptError('Invalid arguments for '+method.value+'.',start.line);
      result.push({method:method.value,args,line:start.line});if(result.length>300)throw new ScriptError('Program exceeds 300 expanded commands.',start.line);
    }
    return result;
  }
  const program=block();if(cursor!==tokens.length)throw new ScriptError('Unexpected closing brace.',peek()?.line);if(!program.length)throw new ScriptError('Write a robot command first.');return program;
}
