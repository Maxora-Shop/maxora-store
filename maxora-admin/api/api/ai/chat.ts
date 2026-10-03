import type { IncomingMessage, ServerResponse } from 'http';
import handler from '../ai-chat';

export default async function (req: IncomingMessage, res: ServerResponse) {
  return handler(req, res);
}
