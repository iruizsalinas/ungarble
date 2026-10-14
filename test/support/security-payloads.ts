import type { ungarble as api } from "../../src/index.js";

export function runSecurityPayloads(ungarble: typeof api, assert: { equal(actual: unknown, expected: unknown): void }) {
  const damaged = 'a\u00c2\u00a9'.repeat(64000) + '\u0100';
  const repaired = 'a\u00a9'.repeat(64000) + '\u0100';
  for (const fn of [ungarble, ungarble.encoding, (text: string) => ungarble.explain(text).text]) {
    assert.equal(fn(damaged), repaired);
  }
  // Near-match failure used to restart the initials regex at every space.
  const initials = 'A '.repeat(256000) + 'x \u00c3 z \u0100';
  assert.equal(ungarble(initials), 'A '.repeat(256000) + 'x \u00e0 z \u0100');
  const marks = 'a' + '\u0315'.repeat(64000) + '\u0300'.repeat(64000);
  assert.equal(ungarble(marks), marks);
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
  // A chain of escaped ampersands decodes where it stands, in one pass.
  assert.equal(ungarble('&' + 'amp;'.repeat(20000) + 'lt;'), '<');
  assert.equal(ungarble('\ud800'.repeat(100000)), '\ufffd'.repeat(100000));
  // Every detector match inside one damaged token used to revalidate the whole
  // token: quadratic, about 25 seconds for this line.
  const token = 'a \ufffd' + '\u00c2\u2591x'.repeat(16000) + '\ufffd';
  assert.equal(ungarble(token), token);
  assert.equal(ungarble.encoding(token), token);
  // Each repair pass resolves one link of the chain, and chunk, pipeline and
  // encoding passes used to multiply into thousands of passes over the line.
  const soup = '\u00c2\u2591 \u00c3\u2592 \u00c2\u2264 \u00c3\u2310 \u00c2\u2560 '.repeat(300);
  const chain = soup + '\u00c3' + '\u00c2'.repeat(8000) + '\u00a9';
  assert.equal(ungarble(chain).startsWith(soup), true);
  // Decoding the innermost reference completes the next one out (&#6&#48;; is
  // &#60;), so each level needs another pipeline pass.
  let nested = '&#60;';
  for (let level = 1; level < 400; level++) {
    const at = nested.indexOf(';') - 1;
    nested = nested.slice(0, at) + '&#' + nested.charCodeAt(at) + ';' + nested.slice(at + 1);
  }
  const nestedChunks = (soup + nested + ' ').repeat(4);
  assert.equal(ungarble(nestedChunks, { chunk: 4000 }).startsWith(soup), true);

  let seed = 0x12345678;
  const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  const atoms = ['a', '\u00c3\u00a9', '\ufffd', '\ud800', '\udc00', '\n', '\x1b[', '\x1b]', '&amp;', '&#x110000;', '&#55296;', '\u0300', '\u0315', '\u00e4\u00b8\u00ad', '\u0412', '\u00a0', '\0'];
  const methods = ['html', 'encoding', 'quotes', 'ligatures', 'width', 'lines', 'surrogates', 'escapes', 'controls', 'c1', 'detect', 'score'] as const;
  for (let i = 0; i < 2000; i++) {
    let input = '';
    const count = rand() % 65;
    for (let j = 0; j < count; j++) input += atoms[rand() % atoms.length]!;
    const options = { chunk: [1, 2, 16, 1e6, NaN, Infinity, -1][rand() % 7]!, html: ([true, false, 'auto'] as const)[rand() % 3]! };
    assert.equal(ungarble(input, options), ungarble.explain(input, options).text);
    for (const method of methods) ungarble[method](input);
  }
}
