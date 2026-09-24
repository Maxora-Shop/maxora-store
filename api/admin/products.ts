import type { IncomingMessage, ServerResponse } from 'http';
import productsHandler from '../products';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  return productsHandler(req, res);
}
