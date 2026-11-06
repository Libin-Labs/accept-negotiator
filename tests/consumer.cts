import api = require('@lp-labs/accept-negotiator');
const selected: string | undefined = api.negotiateAccept('*/*', ['application/json']);
void selected;
