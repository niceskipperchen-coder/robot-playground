import {build} from 'esbuild';
await build({entryPoints:['src/editor.js'],outfile:'dist/editor.bundle.js',bundle:true,format:'esm',target:'es2022',minify:true,legalComments:'eof'});
console.log('Built local CodeMirror editor bundle.');
