import type { IncomingMessage, ServerResponse } from 'http';
import settingsHandler from '../settings';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return settingsHandler(req, res);
}
