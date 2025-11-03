import { PassThrough } from 'stream';
import { csvToJsonStream } from '../../M2-csvToJsonStream/index.js';

test('parses quoted CSV into JSONL', done => {
  const src = new PassThrough();
  const tr = csvToJsonStream();
  const out = [];
  tr.on('data', chunk => out.push(chunk.toString('utf8')));
  tr.on('end', () => {
    const lines = out.join('').trim().split('\n');
    expect(JSON.parse(lines[0])).toEqual({ a: '1', b: 'hello, world', c: 'x"y' });
    expect(JSON.parse(lines[1])).toEqual({ a: '2', b: 'ok', c: '' });
    done();
  });
  src.pipe(tr);
  src.end('a,b,c\r\n1,"hello, world","x""y"\n2,ok,\n');
});
