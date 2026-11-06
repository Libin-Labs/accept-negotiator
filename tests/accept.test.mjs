import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { negotiateAccept } from '../dist/esm/index.js';

test('chooses the offered representation with the highest acceptable quality', () => {
  assert.equal(
    negotiateAccept('text/html;q=0.5, application/json;q=0.9', ['text/html', 'application/json']),
    'application/json',
  );
});
test('uses specificity over wildcard quality for a representation', () => {
  assert.equal(
    negotiateAccept('text/*;q=1, text/html;q=0', ['text/html', 'text/plain']),
    'text/plain',
  );
  assert.equal(
    negotiateAccept('text/*;q=0.8, */*;q=0.2', ['text/plain', 'image/png']),
    'text/plain',
  );
});
test('supports absent/empty Accept and stable offered-order ties', () => {
  assert.equal(negotiateAccept('', ['application/json', 'text/plain']), 'application/json');
  assert.equal(
    negotiateAccept('application/*, text/*', ['text/plain', 'application/json']),
    'text/plain',
  );
});
test('returns undefined when nothing is acceptable', () => {
  assert.equal(negotiateAccept('image/png', ['text/plain']), undefined);
  assert.equal(negotiateAccept('*/*;q=0', ['text/plain']), undefined);
});
test('rejects malformed ranges, quality values and CRLF', () => {
  for (const header of [
    'text',
    '*/plain',
    'text/plain;q=1.5',
    'text/plain;q=0.1234',
    'text/plain\r\nx:y',
    'text/plain\n',
  ])
    assert.throws(() => negotiateAccept(header, ['text/plain']), TypeError);
});
test('requires concrete offered media types and bounds range count', () => {
  assert.throws(() => negotiateAccept('*/*', ['text/*']), TypeError);
  assert.throws(
    () => negotiateAccept(Array(101).fill('text/plain').join(','), ['text/plain']),
    RangeError,
  );
});
test('CommonJS exposes the negotiation function', () => {
  const api = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.deepEqual(Object.keys(api), ['negotiateAccept']);
});
