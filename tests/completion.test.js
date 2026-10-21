import {test} from 'node:test';
import assert from 'node:assert/strict';
import {completionRange} from '../src/completion.js';
test('autocomplete replaces the whole robot statement prefix, including optional await',()=>{for(const prefix of ['await robot.mo','robot.mo','await mo','mo']){const text='  '+prefix;const range=completionRange(text,text.length);const result=text.slice(0,range.from)+'await robot.moveTo(180,80,100);';assert.equal(result,'  await robot.moveTo(180,80,100);');}});
