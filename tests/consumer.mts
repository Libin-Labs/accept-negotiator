import { negotiateAccept } from '@lp-labs/accept-negotiator';
const selected: string | undefined = negotiateAccept('text/html', [
  'text/html',
  'application/json',
]);
// @ts-expect-error offered representations are an array of media types.
negotiateAccept('text/html', 'text/html');
void selected;
