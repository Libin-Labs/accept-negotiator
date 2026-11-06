const TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$(?![\s\S])/;
interface Range {
  type: string;
  subtype: string;
  q: number;
  index: number;
}
interface Candidate {
  type: string;
  subtype: string;
  text: string;
  index: number;
}

function media(input: string): [string, string] {
  const pieces = input.trim().toLowerCase().split('/');
  if (pieces.length !== 2 || !pieces[0] || !pieces[1]) throw new TypeError('Invalid media range.');
  if (
    (pieces[0] === '*' && pieces[1] !== '*') ||
    (pieces[0] !== '*' && pieces[0].includes('*')) ||
    (pieces[1] !== '*' && pieces[1].includes('*')) ||
    (pieces[0] !== '*' && !TOKEN.test(pieces[0])) ||
    (pieces[1] !== '*' && !TOKEN.test(pieces[1]))
  )
    throw new TypeError('Invalid media range token.');
  return [pieces[0], pieces[1]];
}

function parse(accept: string): Range[] {
  if (accept.length > 16_384 || /[\r\n\0]/.test(accept))
    throw new TypeError('Invalid Accept field.');
  if (!accept.trim()) return [{ type: '*', subtype: '*', q: 1, index: 0 }];
  const result: Range[] = [];
  for (const [index, raw] of accept.split(',').entries()) {
    if (result.length >= 100) throw new RangeError('Accept range limit exceeded.');
    const [essence, ...params] = raw.split(';');
    const [type, subtype] = media(essence!);
    let q = 1,
      seenQ = false;
    for (const rawParameter of params) {
      const equals = rawParameter.indexOf('=');
      if (equals <= 0) throw new TypeError('Malformed Accept parameter.');
      const name = rawParameter.slice(0, equals).trim().toLowerCase();
      const value = rawParameter.slice(equals + 1).trim();
      if (!TOKEN.test(name)) throw new TypeError('Invalid Accept parameter name.');
      if (name === 'q') {
        if (seenQ || !/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$(?![\s\S])/.test(value))
          throw new TypeError('Invalid Accept quality value.');
        q = Number(value);
        seenQ = true;
      } else throw new TypeError('Only the q parameter is supported.');
    }
    result.push({ type, subtype, q, index });
  }
  return result;
}

function specificity(range: Range): number {
  return range.type === '*' ? 0 : range.subtype === '*' ? 1 : 2;
}

export function negotiateAccept(accept: string, offered: readonly string[]): string | undefined {
  const ranges = parse(accept);
  const candidates: Candidate[] = offered.map((text, index) => {
    const [type, subtype] = media(text);
    if (type === '*' || subtype === '*')
      throw new TypeError('Offered media types must be concrete.');
    return { type, subtype, text, index };
  });
  let winner: { candidate: Candidate; q: number; spec: number } | undefined;
  for (const candidate of candidates) {
    const matches = ranges.filter(
      (range) =>
        (range.type === '*' || range.type === candidate.type) &&
        (range.subtype === '*' || range.subtype === candidate.subtype),
    );
    if (!matches.length) continue;
    matches.sort((a, b) => specificity(b) - specificity(a) || a.index - b.index);
    const selected = matches[0]!;
    if (selected.q === 0) continue;
    const current = { candidate, q: selected.q, spec: specificity(selected) };
    if (
      !winner ||
      current.q > winner.q ||
      (current.q === winner.q && current.spec > winner.spec) ||
      (current.q === winner.q &&
        current.spec === winner.spec &&
        candidate.index < winner.candidate.index)
    )
      winner = current;
  }
  return winner?.candidate.text;
}
