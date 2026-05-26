import Pusher from 'pusher';

// Use a singleton pattern for Pusher server
const getPusherServer = () => {
  if (!process.env.PUSHER_APP_ID || !process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.PUSHER_SECRET) {
    // During build, environment variables might be missing
    // Return a dummy object to prevent "is not a constructor" or missing property errors
    return {
      trigger: async () => {},
      authenticate: () => ({}),
      authorizeChannel: () => ({}),
    } as unknown as Pusher;
  }

  return new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    useTLS: true,
  });
};

export const pusherServer = getPusherServer();
