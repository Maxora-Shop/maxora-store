import type { IncomingMessage, ServerResponse } from 'http';
import aboutHandler from '../about';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return aboutHandler(req, res);
}
