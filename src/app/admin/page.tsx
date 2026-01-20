'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  MessageSquare,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Ban,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { analyticsApi, type AnalyticsOverview, type UserStats, type RoomStats, type MessageStats, type EngagementMetrics, type UserActivity, type RoomPopularity, type HourlyActivity, type UserListResponse } from '@/lib/analytics-service';
import { PageLoader } from '@/components/page-loader';

const ADMIN_EMAIL = 'mshubh612@gmail.com';

const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#f97316', '#14b8a6'];

export default function AdminPanelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [roomPopularity, setRoomPopularity] = useState<RoomPopularity[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivity[]>([]);
  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (session?.user?.email !== ADMIN_EMAIL) {
      setError('Access Denied: Admin privileges required');
      setLoading(false);
      return;
    }

    loadAnalytics();
  }, [status, session, router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = (session as any)?.backendToken;
      console.log('Session:', session);
      console.log('Backend Token:', token);
      
      if (!token) {
        throw new Error('No access token available');
      }

      // Load all analytics data in parallel
      const [
        overviewData,
        userStatsData,
        roomStatsData,
        messageStatsData,
        engagementData,
        userActivityData,
        roomPopularityData,
        hourlyActivityData,
        userListData,
      ] = await Promise.all([
        analyticsApi.getOverview(token),
        analyticsApi.getUserStats(token, 30),
        analyticsApi.getRoomStats(token, 30),
        analyticsApi.getMessageStats(token, 30),
        analyticsApi.getEngagementMetrics(token),
        analyticsApi.getUserActivity(token, 50),
        analyticsApi.getRoomPopularity(token),
        analyticsApi.getHourlyActivity(token),
        analyticsApi.getUserList(token, 1, 20),
      ]);

      setOverview(overviewData);
      setUserStats(userStatsData);
      setRoomStats(roomStatsData);
      setMessageStats(messageStatsData);
      setEngagement(engagementData);
      setUserActivity(userActivityData);
      setRoomPopularity(roomPopularityData);
      setHourlyActivity(hourlyActivityData);
      setUserList(userListData);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserListPage = async (page: number) => {
    try {
      const token = (session as any)?.backendToken;
      if (!token) return;

      const data = await analyticsApi.getUserList(token, page, 20);
      setUserList(data);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to load user list:', err);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-cyan-900/20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-cyan-900/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive analytics and user engagement tracking
            </p>
          </div>
          <Badge variant="secondary" className="px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            Admin Access
          </Badge>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview?.activeUsersToday} active today
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
              <Activity className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.activeRooms}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview?.systemRooms} system, {overview?.userRooms} user
              </p>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 dark:border-cyan-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview?.messagesLast24h} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{engagement?.monthlyRetention}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly active users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Analytics Views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="userlist">User List</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Messages Per Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Messages Per Day (Last 30 Days)</CardTitle>
                  <CardDescription>Daily message activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={messageStats?.messagesPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hourly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Hour</CardTitle>
                  <CardDescription>Messages sent per hour (Last 7 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="messageCount" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Room Popularity */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Rooms (Last 30 Days)</CardTitle>
                <CardDescription>Top 20 rooms by message count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={roomPopularity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="roomName" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="messageCount" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* New Users Per Day */}
              <Card>
                <CardHeader>
                  <CardTitle>New Users Per Day</CardTitle>
                  <CardDescription>User registration trend (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userStats?.newUsersPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="New Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Active Users Per Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Users Per Day</CardTitle>
                  <CardDescription>Daily active users (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userStats?.activeUsersPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent User Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
                <CardDescription>Last 50 active users</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-125">
                  <div className="space-y-2">
                    {userActivity.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.messageCount} messages</p>
                            <p className="text-xs text-muted-foreground">
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                          </div>
                          {user.banned && (
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" />
                              Banned
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Rooms Created Per Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Rooms Created Per Day</CardTitle>
                  <CardDescription>Room creation trend (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={roomStats?.roomsPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="systemRooms" stroke="#8b5cf6" name="System Rooms" />
                      <Line type="monotone" dataKey="userRooms" stroke="#ec4899" name="User Rooms" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Room Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Room Type Distribution</CardTitle>
                  <CardDescription>System rooms by type (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={roomStats?.roomTypeDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ roomType, percent }) => `${roomType}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(roomStats?.roomTypeDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Room Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Room Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                    <p className="text-sm text-muted-foreground">Average Messages per Room</p>
                    <p className="text-3xl font-bold text-purple-600">{messageStats?.averageMessagesPerRoom}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-pink-50 dark:bg-pink-950/20">
                    <p className="text-sm text-muted-foreground">Rooms with Messages</p>
                    <p className="text-3xl font-bold text-pink-600">{messageStats?.totalRoomsWithMessages}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-cyan-50 dark:bg-cyan-950/20">
                    <p className="text-sm text-muted-foreground">Active Rooms</p>
                    <p className="text-3xl font-bold text-cyan-600">{overview?.activeRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Retention Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Retention</CardTitle>
                  <CardDescription>Active user retention rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Weekly Active Users</span>
                      <Badge variant="secondary">{engagement?.weeklyActiveUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Monthly Active Users</span>
                      <Badge variant="secondary">{engagement?.monthlyActiveUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Weekly Retention</span>
                      <Badge className="bg-linear-to-r from-purple-600 to-pink-600">
                        {engagement?.weeklyRetention}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Monthly Retention</span>
                      <Badge className="bg-linear-to-r from-cyan-600 to-purple-600">
                        {engagement?.monthlyRetention}%
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          { name: 'Weekly', value: parseFloat(engagement?.weeklyRetention || '0') },
                          { name: 'Monthly', value: parseFloat(engagement?.monthlyRetention || '0') },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Message Senders */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                  <CardDescription>Most active users (Last 30 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-100">
                    <div className="space-y-2">
                      {engagement?.topMessageSenders.map((sender, index) => (
                        <div
                          key={sender.username}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{sender.username}</span>
                          </div>
                          <Badge variant="secondary">
                            {sender.messageCount} messages
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User List Tab */}
          <TabsContent value="userlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Total: {userList?.total} users | Page {userList?.page} of {userList?.totalPages}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-150">
                  <div className="space-y-2">
                    {userList?.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                Last login: {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.messageCount} messages</p>
                          </div>
                          {user.banned ? (
                            <Badge variant="destructive">
                              <Ban className="h-3 w-3 mr-1" />
                              Banned
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Pagination */}
                {userList && userList.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => loadUserListPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2">
                      Page {currentPage} of {userList.totalPages}
                    </span>
                    <button
                      onClick={() => loadUserListPage(currentPage + 1)}
                      disabled={currentPage === userList.totalPages}
                      className="px-4 py-2 rounded-lg border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
