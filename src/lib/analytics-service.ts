import { API_CONFIG } from './api-config';

export interface AnalyticsOverview {
  totalUsers: number;
  activeRooms: number;
  totalMessages: number;
  activeUsersToday: number;
  messagesLast24h: number;
  systemRooms: number;
  userRooms: number;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface UserStats {
  newUsersPerDay: DailyStats[];
  activeUsersPerDay: DailyStats[];
}

export interface RoomTypeDistribution {
  roomType: string;
  count: number;
}

export interface RoomStats {
  roomsPerDay: Array<{
    date: string;
    count: number;
    systemRooms: number;
    userRooms: number;
  }>;
  roomTypeDistribution: RoomTypeDistribution[];
}

export interface MessageStats {
  messagesPerDay: DailyStats[];
  averageMessagesPerRoom: number;
  totalRoomsWithMessages: number;
}

export interface EngagementMetrics {
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalUsers: number;
  weeklyRetention: string;
  monthlyRetention: string;
  topMessageSenders: Array<{
    username: string;
    messageCount: number;
  }>;
}

export interface UserActivity {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  lastLogin: string;
  createdAt: string;
  banned: boolean;
  messageCount: number;
}

export interface RoomPopularity {
  roomId: string;
  roomName: string;
  roomType: string | null;
  isSystemRoom: boolean;
  messageCount: number;
}

export interface HourlyActivity {
  hour: number;
  messageCount: number;
}

export interface UserListResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    createdAt: string;
    lastLogin: string;
    banned: boolean;
    banReason: string | null;
    messageCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class AnalyticsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async fetchWithAuth<T>(url: string, token: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch analytics data');
    }

    return response.json();
  }

  async getOverview(token: string): Promise<AnalyticsOverview> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/overview`, token);
  }

  async getUserStats(token: string, days: number = 30): Promise<UserStats> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/users?days=${days}`, token);
  }

  async getRoomStats(token: string, days: number = 30): Promise<RoomStats> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/rooms?days=${days}`, token);
  }

  async getMessageStats(token: string, days: number = 30): Promise<MessageStats> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/messages?days=${days}`, token);
  }

  async getEngagementMetrics(token: string): Promise<EngagementMetrics> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/engagement`, token);
  }

  async getUserActivity(token: string, limit: number = 50): Promise<UserActivity[]> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/user-activity?limit=${limit}`, token);
  }

  async getRoomPopularity(token: string): Promise<RoomPopularity[]> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/room-popularity`, token);
  }

  async getHourlyActivity(token: string): Promise<HourlyActivity[]> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/hourly-activity`, token);
  }

  async getUserList(token: string, page: number = 1, limit: number = 20): Promise<UserListResponse> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/user-list?page=${page}&limit=${limit}`, token);
  }
}

export const analyticsApi = new AnalyticsApiService();
