import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';
import { pusherClient } from '@/lib/pusher-client';
import { useAuthStore } from '@/stores/authStore';

// Types
export interface ChatMessage {
  id: string;
  tempId?: string; // Client-generated ID before server ACK
  chatRoomId: string;
  senderId: string;
  content: string;
  hasBlockedContent: boolean;
  isRead: boolean;
  createdAt: Date | string;
  sender: {
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
}

export interface ChatRoom {
  id: string;
  orderItemId: string;
  customerId: string;
  vendorId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    createdAt: Date | string;
    senderId: string;
  } | null;
  customer: {
    firstName: string;
    lastName: string;
  };
  vendor: {
    businessName: string;
  };
  orderItem: {
    productSnapshot: any;
    variantSnapshot: any;
    order: {
      orderNumber: string;
      status: string;
    };
  };
}

interface ChatState {
  // UI state
  isOpen: boolean;
  selectedRoomId: string | null;
  isConnected: boolean;

  // Data
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>; // roomId → messages
  isTyping: Record<string, boolean>; // roomId → typing status
  activeChannels: string[]; // Tracking active Pusher subscriptions

  // Loading states
  isLoadingRooms: boolean;
  isLoadingMessages: Record<string, boolean>;
  error: string | null;

  // Actions
  fetchRoom: (roomId: string) => Promise<void>;
  openChat: (roomId?: string) => Promise<void>;
  closeChat: () => void;
  selectRoom: (roomId: string) => void;
  loadRooms: () => Promise<void>;
  loadMessages: (roomId: string, offset?: number) => Promise<void>;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  receiveMessage: (message: ChatMessage) => Promise<void>;
  acknowledgeSentMessage: (tempId: string, message: ChatMessage) => void;
  removeTempMessage: (roomId: string, tempId: string) => void;
  setTyping: (roomId: string, isTyping: boolean) => void;
  markAsRead: (roomId: string) => void;
  setConnected: (connected: boolean) => void;
  initializePusherListeners: () => void;
  cleanupPusherListeners: () => void;
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: (roomId: string) => void;
  sendTyping: (roomId: string) => void;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    // Initial state
    isOpen: false,
    selectedRoomId: null,
    isConnected: false,
    rooms: [],
    messages: {},
    isTyping: {},
    activeChannels: [],
    isLoadingRooms: false,
    isLoadingMessages: {},
    error: null,

    // Fetch a single room
    fetchRoom: async (roomId) => {
      try {
        const response = await fetch(`/api/chat/rooms/${roomId}`, {
          credentials: 'include',
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server');
        }

        const data = await response.json();
        
        if (data.success) {
          set((state) => {
            // Check if room already exists
            const exists = state.rooms.some((r) => r.id === roomId);
            if (!exists) {
              state.rooms.unshift(data.room);
            } else {
              // Update existing room data
              const index = state.rooms.findIndex((r) => r.id === roomId);
              state.rooms[index] = { ...state.rooms[index], ...data.room };
            }
          });
          
          // Auto-subscribe to the room channel
          get().subscribeToRoom(roomId);
        }
      } catch (error) {
        console.error('[ChatStore] Failed to fetch room:', error);
      }
    },

    // Open chat dialog
    openChat: async (roomId) => {
      set((state) => {
        state.isOpen = true;
        if (roomId) {
          state.selectedRoomId = roomId;
        }
      });

      // Load rooms if not loaded
      if (get().rooms.length === 0) {
        await get().loadRooms();
      }

      // If a specific room is requested but not in the list, fetch it
      if (roomId && !get().rooms.some((r) => r.id === roomId)) {
        await get().fetchRoom(roomId);
      }

      // Initialize Pusher if not connected
      if (!get().isConnected) {
        get().initializePusherListeners();
      }

      // Load messages if room is selected
      if (roomId && !get().messages[roomId]) {
        get().loadMessages(roomId);
      }
      
      // If room selected, ensure we are subscribed
      if (roomId) {
        get().subscribeToRoom(roomId);
        get().markAsRead(roomId);
      }
    },

    // Close chat dialog
    closeChat: () => {
      set((state) => {
        state.isOpen = false;
        state.selectedRoomId = null;
      });
    },

    // Select a room
    selectRoom: (roomId) => {
      set((state) => {
        state.selectedRoomId = roomId;
      });

      // Load messages if not loaded
      if (!get().messages[roomId]) {
        get().loadMessages(roomId);
      }

      // Ensure subscribed
      get().subscribeToRoom(roomId);

      // Mark messages as read
      get().markAsRead(roomId);
    },

    // Load user's chat rooms
    loadRooms: async () => {
      set((state) => {
        state.isLoadingRooms = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/chat/rooms', {
          credentials: 'include',
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[ChatStore] Expected JSON but received:', text.substring(0, 100));
          throw new Error('Server returned an invalid response. Please check if you are logged in.');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load chat rooms');
        }

        set((state) => {
          state.rooms = data.rooms;
          state.isLoadingRooms = false;
        });
        
        // Subscribe to all rooms for real-time updates
        data.rooms.forEach((room: ChatRoom) => {
          get().subscribeToRoom(room.id);
        });
      } catch (error: any) {
        console.error('Failed to load chat rooms:', error);
        set((state) => {
          state.error = error.message;
          state.isLoadingRooms = false;
        });
        // Avoid showing toast if it's a common auth issue during hydration
        if (error.message !== 'Unauthorized') {
           toast.error(error.message || 'Failed to load chat rooms');
        }
      }
    },

    // Load messages for a room
    loadMessages: async (roomId, offset = 0) => {
      set((state) => {
        state.isLoadingMessages[roomId] = true;
        state.error = null;
      });

      try {
        const response = await fetch(
          `/api/chat/rooms/${roomId}/messages?offset=${offset}&limit=50`,
          {
            credentials: 'include',
          }
        );

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load messages');
        }

        set((state) => {
          if (offset === 0) {
            // Initial load
            state.messages[roomId] = data.messages;
          } else {
            // Load more (prepend older messages)
            state.messages[roomId] = [...data.messages, ...(state.messages[roomId] || [])];
          }
          state.isLoadingMessages[roomId] = false;
        });
      } catch (error: any) {
        console.error('Failed to load messages:', error);
        set((state) => {
          state.error = error.message;
          state.isLoadingMessages[roomId] = false;
        });
        toast.error(error.message || 'Failed to load messages');
      }
    },

    // Send a message
    sendMessage: async (roomId, content) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random()}`;

      // Get current user ID (from rooms data)
      const room = get().rooms.find((r) => r.id === roomId);
      if (!room) {
        toast.error('Chat room not found');
        return;
      }

      // Get current user info
      const currentUser = useAuthStore.getState().user;
      
      // Create temporary message for optimistic update
      const tempMessage: ChatMessage = {
        id: tempId,
        tempId,
        chatRoomId: roomId,
        senderId: currentUser?.id || 'current-user',
        content: trimmedContent,
        hasBlockedContent: false,
        isRead: false,
        createdAt: new Date(),
        sender: {
          firstName: currentUser?.firstName || 'You',
          lastName: currentUser?.lastName || '',
          role: currentUser?.role || 'CUSTOMER',
        },
      };

      // Add to store (optimistic update)
      set((state) => {
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        state.messages[roomId].push(tempMessage);
      });

      // REST API call (which triggers Pusher server-side)
      try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ content: trimmedContent }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Replace temp message with real one
        get().acknowledgeSentMessage(tempId, data.message);

        // Show warning if contact info was blocked
        if (data.contactBlocked) {
          toast.warning('Your message contained blocked content and was filtered');
        }
      } catch (error: any) {
        console.error('Failed to send message:', error);

        // Remove temp message
        get().removeTempMessage(roomId, tempId);

        toast.error(error.message || 'Failed to send message. Please try again.');
      }
    },

    // Receive message from Pusher
    receiveMessage: async (message) => {
      const roomId = message.chatRoomId;
      const currentUser = useAuthStore.getState().user;

      // Skip if we are the sender (it's already handled optimistically or via REST return)
      if (currentUser && message.senderId === currentUser.id) {
          // But we might need to reconcile if optimistic update hasn't happened
          // for now, rely on acknowledgeSentMessage
          return;
      }

      // If room doesn't exist in our list, fetch it first
      if (!get().rooms.some((r) => r.id === roomId)) {
        await get().fetchRoom(roomId);
      }

      set((state) => {
        // Initialize messages array if needed
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }

        // Check if message already exists (prevent duplicates)
        const exists = state.messages[roomId].some(
          (m) => m.id === message.id || (message.tempId && m.tempId === message.tempId)
        );

        if (!exists) {
          state.messages[roomId].push(message);

          // Show toast notification if chat is closed or another room is selected
          if (!state.isOpen || state.selectedRoomId !== roomId) {
            const senderName = `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() || 'New Message';
            toast.info(`New message from ${senderName}`, {
              description: message.content.length > 60 ? message.content.substring(0, 60) + '...' : message.content,
              action: {
                label: 'View',
                onClick: () => get().openChat(roomId),
              },
            });
          }
        }

        // Update room's last message and unread count
        const room = state.rooms.find((r) => r.id === roomId);
        if (room) {
          room.lastMessage = {
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
          };
          room.updatedAt = new Date();

          // Increment unread count if not the current room
          if (state.selectedRoomId !== roomId) {
            room.unreadCount = (room.unreadCount || 0) + 1;
          }
        }
      });
    },

    // Acknowledge sent message (replace temp with real)
    acknowledgeSentMessage: (tempId, message) => {
      set((state) => {
        const roomId = message.chatRoomId;
        const roomMessages = state.messages[roomId] || [];

        // Find temp message by tempId
        const tempIndex = roomMessages.findIndex((m) => m.tempId === tempId);

        if (tempIndex !== -1) {
          // Replace temp message with real one
          state.messages[roomId][tempIndex] = message;
        } else {
          // If temp not found, check if it exists by ID
          const exists = state.messages[roomId].some(m => m.id === message.id);
          if (!exists) {
             state.messages[roomId].push(message);
          }
        }
      });
    },

    // Remove temp message (on error)
    removeTempMessage: (roomId, tempId) => {
      set((state) => {
        if (!state.messages[roomId]) return;

        state.messages[roomId] = state.messages[roomId].filter(
          (m) => m.tempId !== tempId
        );
      });
    },

    // Set typing indicator
    setTyping: (roomId, isTyping) => {
      set((state) => {
        state.isTyping[roomId] = isTyping;
      });

      // Auto-hide after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          set((state) => {
            state.isTyping[roomId] = false;
          });
        }, 3000);
      }
    },

    // Mark messages as read
    markAsRead: async (roomId) => {
      try {
        // Call API (triggers Pusher event)
        await fetch(`/api/chat/rooms/${roomId}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });

        // Update local state
        set((state) => {
          // Mark messages as read
          const messages = state.messages[roomId] || [];
          messages.forEach((m) => {
            m.isRead = true;
          });

          // Reset unread count
          const room = state.rooms.find((r) => r.id === roomId);
          if (room) {
            room.unreadCount = 0;
          }
        });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    },

    // Set connection status
    setConnected: (connected) => {
      set((state) => {
        state.isConnected = connected;
      });
    },

    // Subscribe to a Pusher room channel
    subscribeToRoom: (roomId) => {
      const channelName = `private-room-${roomId}`;
      if (get().activeChannels.includes(channelName)) return;

      const channel = pusherClient.subscribe(channelName);
      
      channel.bind('new-message', (data: { message: ChatMessage }) => {
        get().receiveMessage(data.message);
      });

      channel.bind('messages-read', (data: { roomId: string, readerId: string }) => {
        set((state) => {
          const { roomId, readerId } = data;
          const messages = state.messages[roomId] || [];
          messages.forEach((m) => {
            if (m.senderId !== readerId) {
              m.isRead = true;
            }
          });
        });
      });

      channel.bind('client-typing', (data: { roomId: string }) => {
        get().setTyping(data.roomId, true);
      });

      set((state) => {
        state.activeChannels.push(channelName);
      });
    },

    // Unsubscribe
    unsubscribeFromRoom: (roomId) => {
      const channelName = `private-room-${roomId}`;
      if (!get().activeChannels.includes(channelName)) return;

      pusherClient.unsubscribe(channelName);
      set((state) => {
        state.activeChannels = state.activeChannels.filter(c => c !== channelName);
      });
    },

    // Initialize Pusher listeners
    initializePusherListeners: () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      // Global user channel for notifications etc
      const userChannel = pusherClient.subscribe(`private-user-${user.id}`);
      
      userChannel.bind('pusher:subscription_succeeded', () => {
        get().setConnected(true);
      });

      userChannel.bind('pusher:subscription_error', () => {
        get().setConnected(false);
        toast.error('Failed to connect to real-time service');
      });

      // Handle connection states
      pusherClient.connection.bind('state_change', (states: any) => {
        if (states.current === 'connected') {
          get().setConnected(true);
        } else if (states.current === 'disconnected' || states.current === 'failed') {
          get().setConnected(false);
        }
      });
    },

    // Send typing event
    sendTyping: (roomId) => {
      const channelName = `private-room-${roomId}`;
      const channel = pusherClient.channel(channelName);
      if (channel) {
        channel.trigger('client-typing', { roomId });
      }
    },

    // Cleanup
    cleanupPusherListeners: () => {
      const user = useAuthStore.getState().user;
      if (user) {
        pusherClient.unsubscribe(`private-user-${user.id}`);
      }
      
      // Unsubscribe from all rooms
      get().activeChannels.forEach(channelName => {
        pusherClient.unsubscribe(channelName);
      });
      
      set((state) => {
        state.activeChannels = [];
        state.isConnected = false;
      });
    },
  }))
);
