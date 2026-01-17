import { API_CONFIG, Room, NearbyCountResponse, UserRoomSlotsResponse, CreateUserRoomRequest, ApiError } from './api-config';

class RoomsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<{ status: string; app: string }> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  /**
   * Discover system rooms for a location
   */
  async discoverRooms(lat: number, lng: number, city?: string): Promise<Room[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(city && { city }),
    });
    
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.DISCOVER_ROOMS}?${params}`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to discover rooms');
    }
    return response.json();
  }

  /**
   * Get all nearby rooms (system + user)
   */
  async getNearbyRooms(lat: number, lng: number): Promise<Room[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NEARBY_ROOMS}?${params}`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to get nearby rooms');
    }
    return response.json();
  }

  /**
   * Get total active users count near a location
   */
  async getNearbyActiveCount(lat: number, lng: number): Promise<NearbyCountResponse> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.NEARBY_COUNT}?${params}`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to get active count');
    }
    return response.json();
  }

  /**
   * Get room details by ID
   */
  async getRoomDetails(roomId: string): Promise<Room> {
    const response = await fetch(
      `${this.baseUrl}${API_CONFIG.ENDPOINTS.ROOM_DETAILS(roomId)}`
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to get room details');
    }
    return response.json();
  }

  /**
   * Get messages for a room
   */
  async getRoomMessages(roomId: string, limit: number = 100): Promise<any[]> {
    const params = new URLSearchParams({
      roomId: roomId,
      limit: limit.toString(),
    });
    
    const response = await fetch(
      `${this.baseUrl}${API_CONFIG.ENDPOINTS.ROOM_MESSAGES(roomId)}?${params}`
    );
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to get messages');
    }
    return response.json();
  }

  /**
   * Create a new user room
   */
  async createUserRoom(data: CreateUserRoomRequest): Promise<Room> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CREATE_USER_ROOM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to create room');
    }
    return response.json();
  }

  /**
   * Get all user rooms in an area
   */
  async getUserRooms(lat: number, lng: number): Promise<Room[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GET_USER_ROOMS}?${params}`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to get user rooms');
    }
    return response.json();
  }

  /**
   * Check available user room slots
   */
  async checkUserRoomSlots(lat: number, lng: number): Promise<UserRoomSlotsResponse> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.USER_ROOM_SLOTS}?${params}`);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to check room slots');
    }
    return response.json();
  }

  /**
   * Trigger cleanup of expired rooms
   */
  async cleanupExpiredRooms(): Promise<{ message: string; deletedRooms: number; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CLEANUP_ROOMS}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to cleanup rooms');
    }
    return response.json();
  }
}

// Export singleton instance
export const roomsApi = new RoomsApiService();
