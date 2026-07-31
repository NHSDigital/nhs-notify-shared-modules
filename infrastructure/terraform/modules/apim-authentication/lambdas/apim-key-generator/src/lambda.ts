// This is a Lambda entrypoint file.

import { cleanAndRefreshKeystores } from 'refresh-keystores';

export const handler = async () => cleanAndRefreshKeystores({});
