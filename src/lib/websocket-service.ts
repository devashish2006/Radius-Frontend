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

interface YourIdentityData {
  username: string;
}

interface SlowModeData {
  secondsLeft: number;
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

  /**
   * Connect to WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(API_CONFIG.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
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
    console.log('🚪 Joining room:', data);
  }

  /**
   * Leave current room
   */
  leaveRoom(roomId: string, userId: string) {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit('leave-room', { roomId, userId });
    console.log('👋 Leaving room:', roomId);
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
    console.log('📤 Sending message:', data);
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
   * Remove all listeners
   */
  removeAllListeners() {
    if (!this.socket) return;
    this.socket.off('new-message');
    this.socket.off('user-count');
    this.socket.off('user-joined');
    this.socket.off('your-identity');
    this.socket.off('slow-mode');
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      console.log('🔌 WebSocket disconnected');
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
