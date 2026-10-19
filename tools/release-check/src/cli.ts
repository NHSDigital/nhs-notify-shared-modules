#!/usr/bin/env node
/* istanbul ignore file -- thin CLI bootstrap */

import { run } from '.';

run(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`${(error as Error).stack ?? String(error)}\n`);
  process.exit(1);
});
