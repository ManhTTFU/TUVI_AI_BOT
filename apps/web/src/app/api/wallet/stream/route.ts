import { auth } from '@/auth';
import { subscribe } from '@/lib/sse-bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE channel cho user — emit `balance` event mỗi khi admin credit / Casso confirm.
 * Client connect bằng EventSource('/api/wallet/stream').
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      const send = (chunk: string) => controller.enqueue(enc.encode(chunk));

      // Initial ping để client biết stream đã mở.
      send(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

      const unsubscribe = subscribe(userId, (msg) => send(msg));

      // Heartbeat 25s — qua proxy thường timeout 30s, tránh chết connection.
      const heartbeat = setInterval(() => {
        try {
          send(`: heartbeat\n\n`);
        } catch {
          /* closed */
        }
      }, 25_000);

      // Cleanup khi client disconnect — controller throws, dùng abort signal.
      const abort = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      // Lưu vào controller để cancel có thể gọi.
      (controller as any)._cleanup = abort;
    },
    cancel() {
      const c = this as any;
      if (typeof c._cleanup === 'function') c._cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
