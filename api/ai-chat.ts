import type { IncomingMessage, ServerResponse } from 'http';
import { processAiChatMessage, AiChatRequest } from '../src/server/aiChatCore';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const payload: AiChatRequest = JSON.parse(body || '{}');

    if (!payload.message || typeof payload.message !== 'string') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Message is required' }));
      return;
    }

    const result = await processAiChatMessage(payload);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, ...result }));
  } catch (err: any) {
    console.error('API /api/ai-chat error:', err);
    res.statusCode = 200; // Return 200 with graceful Bengali error message
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        reply:
          'দুঃখিত, এই মুহূর্তে AI Assistant সাময়িকভাবে unavailable। আবার চেষ্টা করুন অথবা আমাদের WhatsApp support-এ যোগাযোগ করুন।',
        needsWhatsApp: true,
        whatsappPrefilledText: 'হ্যালো Maxora, আমি কাস্টমার সাপোর্টে যোগাযোগ করতে চাই।',
        source: 'fallback',
      })
    );
  }
}
