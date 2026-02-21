import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './api-config';

interface Message {
  username: string;
  message: string;
  time: Date;
}

interface UserCountData {
  userCount?: number;
}

interface UserJoinedData {
  username: string;
}

interface UserLeftData {
  username: string;
}

interface YourIdentityData {
  username: string;
}

interface SlowModeData {
  secondsLeft: number;
}

interface RoomClosingData {
  message: string;
}

interface LastUserWarningData {
  message: string;
}

interface MessageBlockedData {
  message: string;
  reason?: string;
}

interface UserBannedData {
  message: string;
  banReason: string;
  bannedAt: string;
}

interface JoinRoomData {
  roomId: string;
}

interface SendMessageData {
  roomId: string;
  message: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  /**
   * Connect to WebSocket server with JWT token
   */
  connect(token?: string): Socket {
    // If already connected, return existing socket
    if (this.socket?.connected) {

      return this.socket;
    }

    // If socket exists but not connected, try to reconnect
    if (this.socket && !this.socket.connected) {

      this.socket.connect();
      return this.socket;
    }

    this.socket = io(API_CONFIG.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: {
        token: token || '',
      },
    });

    this.socket.on('connect', () => {

      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually

        this.socket?.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {

      this.reconnectAttempts = 0;
      
      // Rejoin the room if we were in one
      if (this.currentRoomId) {

        this.socket?.emit('join-room', { roomId: this.currentRoomId });
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {

      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Listen for ban event
    this.socket.on('user-banned', (data: UserBannedData) => {

      // Redirect to ban page
      if (typeof window !== 'undefined') {
        window.location.href = `/banned?reason=${encodeURIComponent(data.banReason || 'Account suspended')}&bannedAt=${encodeURIComponent(data.bannedAt || new Date().toISOString())}`;
      }
    });

    return this.socket;
  }

  /**
   * Join a chat room
   */
  joinRoom(data: JoinRoomData) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.currentRoomId = data.roomId;
    this.socket.emit('join-room', data);

  }

  /**
   * Leave current room
   */
  leaveRoom(roomId: string, userId: string) {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit('leave-room', { roomId, userId });

    this.currentRoomId = null;
  }

  /**
   * Send a message to the current room
   */
  sendMessage(data: SendMessageData) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('send-message', data);

  }

  /**
   * Listen for incoming messages
   */
  onMessage(callback: (data: Message) => void) {
    if (!this.socket) return;
    this.socket.on('new-message', callback);
  }

  /**
   * Listen for user count updates
   */
  onUserCount(callback: (count: number) => void) {
    if (!this.socket) return;
    this.socket.on('user-count', callback);
  }

  /**
   * Listen for user joined notifications
   */
  onUserJoined(callback: (data: UserJoinedData) => void) {
    if (!this.socket) return;
    this.socket.on('user-joined', callback);
  }

  /**
   * Listen for user left notifications
   */
  onUserLeft(callback: (data: UserLeftData) => void) {
    if (!this.socket) return;
    this.socket.on('user-left', callback);
  }

  /**
   * Listen for your identity assignment
   */
  onYourIdentity(callback: (data: YourIdentityData) => void) {
    if (!this.socket) return;
    this.socket.on('your-identity', callback);
  }

  /**
   * Listen for slow mode notifications
   */
  onSlowMode(callback: (data: SlowModeData) => void) {
    if (!this.socket) return;
    this.socket.on('slow-mode', callback);
  }

  /**
   * Listen for room closing notifications
   */
  onRoomClosing(callback: (data: RoomClosingData) => void) {
    if (!this.socket) return;
    this.socket.on('room-closing', callback);
  }

  /**
   * Listen for room expired notifications (auto-deleted after 2 hours)
   */
  onRoomExpired(callback: (data: { roomId: string; roomName: string; message: string }) => void) {
    if (!this.socket) return;
    this.socket.on('room-expired', callback);
  }

  /**
   * Listen for last user warning
   */
  onLastUserWarning(callback: (data: LastUserWarningData) => void) {
    if (!this.socket) return;
    this.socket.on('last-user-warning', callback);
  }

  /**
   * Listen for message blocked notifications (content moderation)
   */
  onMessageBlocked(callback: (data: MessageBlockedData) => void) {
    if (!this.socket) return;
    this.socket.on('message-blocked', callback);
  }

  /**
   * Listen for connection state changes
   */
  onConnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('connect', callback);
  }

  /**
   * Listen for disconnection
   */
  onDisconnect(callback: (reason: string) => void) {
    if (!this.socket) return;
    this.socket.on('disconnect', callback);
  }

  /**
   * Listen for reconnection
   */
  onReconnect(callback: () => void) {
    if (!this.socket) return;
    this.socket.on('reconnect', callback);
  }

  /**
   * Listen for new room creation
   */
  onNewRoomCreated(callback: (roomData: any) => void) {
    if (!this.socket) return;
    this.socket.on('new-room-created', callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.off('new-message');
    this.socket.off('user-count');
    this.socket.off('user-joined');
    this.socket.off('user-left');
    this.socket.off('your-identity');
    this.socket.off('slow-mode');
    this.socket.off('room-closing');
    this.socket.off('last-user-warning');
    this.socket.off('message-blocked');
    // Don't remove connection listeners as they're needed for reconnection
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;

    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current room ID
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
