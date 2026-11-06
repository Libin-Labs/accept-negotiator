# @lp-labs/accept-negotiator

Deterministic `Accept` media-range negotiation for a caller-provided list of representations.
It selects a name only; it has no server or hidden content registry. Independent with zero
runtime or peer dependencies.

## Install and quickstart

```bash
npm install @lp-labs/accept-negotiator
```

```js
import { negotiateAccept } from '@lp-labs/accept-negotiator';

const selected = negotiateAccept('text/*;q=0.8, application/json;q=1', [
  'text/html',
  'application/json',
]);
if (selected !== 'application/json') throw new Error('Negotiation failed');
```

## API and selection rules

- `negotiateAccept(accept: string, offered: readonly string[]): string | undefined`.
- Offered values must be concrete `type/subtype` media types. Quality values are from 0 to 1 with
  at most three fractional digits. Empty `Accept` means `*/*;q=1`.
- Each candidate uses its most specific matching range (`type/subtype`, `type/*`, then `*/*`);
  quality zero excludes it. The acceptable candidate with greatest quality wins; ties retain the
  caller's offered order. A missing match returns `undefined`.

The parser bounds fields to 16,384 characters and 100 ranges and rejects malformed tokens,
parameters, quality values and CR/LF. Only the `q` media parameter is supported; other parameters
are rejected rather than silently treated as matching criteria. Invalid input throws `TypeError`;
excess count throws `RangeError`.

Parsing and matching are O(A × O), where A is range count (at most 100) and O is offered count.
This intentionally small implementation does not match media parameters, charset/language
preferences, suffix wildcards, server defaults, or HTTP response behavior.

Runtime export: `negotiateAccept`. ESM/CommonJS declarations included; Node.js 18+ and ES2022,
with no browser globals.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
