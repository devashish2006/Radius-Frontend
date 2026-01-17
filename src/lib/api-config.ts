// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000',
  ENDPOINTS: {
    HEALTH: '/health',
    DISCOVER_ROOMS: '/rooms/discover',
    NEARBY_ROOMS: '/rooms/nearby',
    NEARBY_COUNT: '/rooms/nearby/count',
    ROOM_DETAILS: (roomId: string) => `/rooms/${roomId}`,
    ROOM_MESSAGES: (roomId: string) => `/rooms/${roomId}/messages`,
    CREATE_USER_ROOM: '/rooms/user',
    GET_USER_ROOMS: '/rooms/user',
    USER_ROOM_SLOTS: '/rooms/user/slots',
    CLEANUP_ROOMS: '/rooms/cleanup',
  },
};

// Default location (Delhi coordinates)
export const DEFAULT_LOCATION = {
  lat: 28.6139,
  lng: 77.2090,
  city: 'Delhi',
};

// API Response Types
export interface Room {
  id: string;
  name?: string;
  title?: string;
  type: 'system' | 'user';
  latitude: number;
  longitude: number;
  city?: string;
  isActive: boolean;
  activeUserCount: number;
  distance?: number;
  createdAt: string;
  createdBy?: string;
  expiresAt?: string;
  lastActivityAt?: string;
}

export interface NearbyCountResponse {
  totalActiveUsers: number;
  latitude: number;
  longitude: number;
}

export interface UserRoomSlotsResponse {
  total: number;
  used: number;
  available: number;
}

export interface CreateUserRoomRequest {
  title: string;
  lat: number;
  lng: number;
  createdBy: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
