import Pusher from 'pusher-js';

// Initialize Pusher client only in the browser
const getPusherClient = () => {
  if (typeof window === 'undefined') {
    // Return a mock object for SSR to prevent crashes during build/prerender
    return {
      subscribe: () => ({ bind: () => {}, unbind: () => {} }),
      unsubscribe: () => {},
      channel: () => null,
      connection: { bind: () => {}, unbind: () => {} },
    } as unknown as Pusher;
  }

  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    console.warn('[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY. Real-time features will be disabled.');
    return {
      subscribe: () => ({ bind: () => {}, unbind: () => {} }),
      unsubscribe: () => {},
      channel: () => null,
      connection: { bind: () => {}, unbind: () => {} },
    } as unknown as Pusher;
  }

  return new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_KEY,
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }
  );
};

export const pusherClient = getPusherClient();
