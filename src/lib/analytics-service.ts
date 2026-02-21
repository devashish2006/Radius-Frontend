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
  violationCount: number;
  // New tracking fields
  loginCount: number;
  totalSessions: number;
  averageSessionDuration: number;
  firstLoginDate: string;
  lastActivityAt: string;
  preferredRoomTypes: string | null;
  totalRoomsCreated: number;
  totalRoomsJoined: number;
  isOnline: boolean;
  lastSeenAt: string;
  daysSinceJoined: number;
  engagementScore: number;
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
    violationCount: number;
    // New tracking fields
    loginCount: number;
    totalSessions: number;
    averageSessionDuration: number;
    firstLoginDate: string;
    lastActivityAt: string;
    preferredRoomTypes: string | null;
    totalRoomsCreated: number;
    totalRoomsJoined: number;
    isOnline: boolean;
    lastSeenAt: string;
    daysSinceJoined: number;
    engagementScore: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BannedUser {
  id: string;
  email: string;
  name: string;
  anonymousName: string;
  banned: boolean;
  banReason: string | null;
  lastLogin: string;
  createdAt: string;
  violationCount: number;
}

export interface RecentMessage {
  id: string;
  message: string;
  username: string;
  roomId: string;
  roomName: string;
  createdAt: string;
  userId: string | null;
}

export interface UserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    createdAt: string;
    lastLogin: string;
    banned: boolean;
    banReason: string | null;
    bannedAt: string | null;
    violationCount: number;
    loginCount: number;
    totalSessions: number;
    averageSessionDuration: number;
    firstLoginDate: string;
    lastActivityAt: string;
    preferredRoomTypes: string | null;
    totalRoomsCreated: number;
    totalRoomsJoined: number;
    isOnline: boolean;
    lastSeenAt: string;
    daysSinceJoined: number;
    messagesPerDay: number;
  };
  stats: {
    totalMessages: number;
    messageHistory: Array<{ date: string; count: number }>;
    favoriteRooms: Array<{
      roomId: string;
      roomName: string;
      roomType: string | null;
      messageCount: number;
    }>;
    activityByHour: Array<{ hour: number; count: number }>;
  };
  recentActivity: Array<{
    id: string;
    message: string;
    roomId: string;
    roomName: string;
    createdAt: string;
  }>;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  lastSeenAt: string;
  isOnline: boolean;
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

  async banUser(token: string, userId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/analytics/ban-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to ban user');
    }

    return response.json();
  }

  async unbanUser(token: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/analytics/unban-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to unban user');
    }

    return response.json();
  }

  async getBannedUsers(token: string): Promise<BannedUser[]> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/banned-users`, token);
  }

  async getRecentActivity(token: string, limit: number = 100): Promise<RecentMessage[]> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/recent-activity?limit=${limit}`, token);
  }

  async getUserDetails(token: string, userId: string): Promise<UserDetails> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/user-details/${userId}`, token);
  }

  async getOnlineUsers(token: string): Promise<OnlineUser[]> {
    return this.fetchWithAuth(`${this.baseUrl}/analytics/online-users`, token);
  }
}

export const analyticsApi = new AnalyticsApiService();
