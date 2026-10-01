import type { IncomingMessage, ServerResponse } from 'http';
import ordersHandler from '../orders';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return ordersHandler(req, res);
}
