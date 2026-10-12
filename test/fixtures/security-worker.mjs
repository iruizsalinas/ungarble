import assert from 'node:assert/strict';
import { parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { ungarble as esm } from '../../dist/index.js';

const ungarble = workerData === 'cjs' ? createRequire(import.meta.url)('../../dist/index.cjs').ungarble : esm;
try {
  const damaged = 'a\u00c2\u00a9'.repeat(64000) + '\u0100';
  const repaired = 'a\u00a9'.repeat(64000) + '\u0100';
  for (const fn of [ungarble, ungarble.encoding, text => ungarble.explain(text).text]) {
    assert.equal(fn(damaged), repaired);
  }
  // Near-match failure used to restart the initials regex at every space.
  const initials = 'A '.repeat(256000) + 'x \u00c3 z \u0100';
  assert.equal(ungarble(initials), 'A '.repeat(256000) + 'x \u00e0 z \u0100');
  const marks = 'a' + '\u0315'.repeat(64000) + '\u0300'.repeat(64000);
  assert.throws(() => ungarble(marks), RangeError);
  assert.equal(ungarble(marks, { normalization: false }), marks);
  for (const input of ['\x1b[' + '1;'.repeat(100000), '\x1b]' + 'a'.repeat(100000), '\x1b]a'.repeat(100000)]) {
    assert.equal(ungarble.escapes(input), input);
  }
  // Long partial matches exercise the public regex entry points in isolation.
  const terminalNearMisses = ('\x1b]unterminated\x1b[' + '1;'.repeat(8)).repeat(20000);
  assert.equal(ungarble.escapes(terminalNearMisses), terminalNearMisses);
  const entityNearMisses = ('&' + 'a'.repeat(24) + ':').repeat(20000);
  assert.equal(ungarble.html(entityNearMisses), entityNearMisses);
  assert.equal(ungarble(entityNearMisses), entityNearMisses);
  const hebrewPairs = '\u00d7\u00a0'.repeat(50000) + '!';
  assert.equal(typeof ungarble.score(hebrewPairs), 'number');
  assert.equal(typeof ungarble.detect(hebrewPairs), 'boolean');
  const utf8Pairs = '\u00c3\u00a9'.repeat(50000) + '!';
  assert.equal(typeof ungarble.detect(utf8Pairs), 'boolean');
  assert.equal(ungarble.encoding(utf8Pairs).endsWith('!'), true);
  // A caller-controlled tiny chunk size must still terminate on large inputs.
  assert.equal(ungarble('a'.repeat(100000), { chunk: 1 }), 'a'.repeat(100000));
  assert.equal(ungarble('&' + 'amp;'.repeat(20000) + 'lt;').length, 80004 - 80);
  assert.equal(ungarble('\ud800'.repeat(100000)), '\ufffd'.repeat(100000));

  let seed = 0x12345678;
  const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  const atoms = ['a', '\u00c3\u00a9', '\ufffd', '\ud800', '\udc00', '\n', '\x1b[', '\x1b]', '&amp;', '&#x110000;', '&#55296;', '\u0300', '\u0315', '\u00e4\u00b8\u00ad', '\u0412', '\u00a0', '\0'];
  const methods = ['html', 'encoding', 'quotes', 'ligatures', 'width', 'lines', 'surrogates', 'escapes', 'controls', 'c1', 'detect', 'score'];
  for (let i = 0; i < 2000; i++) {
    let input = '';
    const count = rand() % 65;
    for (let j = 0; j < count; j++) input += atoms[rand() % atoms.length];
    const options = { chunk: [1, 2, 16, 1e6, NaN, Infinity, -1][rand() % 7], html: [true, false, 'auto'][rand() % 3] };
    assert.equal(ungarble(input, options), ungarble.explain(input, options).text);
    for (const method of methods) ungarble[method](input);
  }
  parentPort.postMessage({ ok: true });
} catch (error) {
  parentPort.postMessage({ ok: false, error: error.stack });
}
