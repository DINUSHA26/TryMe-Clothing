'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';


/**
 * Chat Initializer Component
 * Connects to Pusher and starts listening for messages as soon as the user is authenticated
 * Should be rendered at the layout level
 */
export function ChatInitializer() {
  const { initializePusherListeners, isConnected } = useChatStore();
  const { user, accessToken, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for auth to hydrate and user to be logged in
    if (!_hasHydrated || !user || !accessToken) return;

    // Initialize Pusher listeners
    if (!isConnected) {
      try {
        console.log('[ChatInit] Initializing Pusher for user:', user.email);
        initializePusherListeners();
      } catch (error) {
        console.error('[ChatInit] Pusher initialization failed:', error);
      }
    }
  }, [_hasHydrated, user, accessToken, isConnected, initializePusherListeners]);

  return null; // This component doesn't render anything
}
