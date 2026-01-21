'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  Ban,
  Shield,
  AlertTriangle,
  Clock,
  Eye,
  UserX,
  CheckCircle,
  Search,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { 
  analyticsApi, 
  type AnalyticsOverview, 
  type UserStats, 
  type RoomStats, 
  type MessageStats, 
  type UserListResponse,
  type BannedUser,
  type RecentMessage,
} from '@/lib/analytics-service';
import { PageLoader } from '@/components/page-loader';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'mshubh612@gmail.com';

export default function AdminPanelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [userList, setUserList] = useState<UserListResponse | null>(null);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentMessage[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      
      if (!token) {
        throw new Error('No access token available');
      }

      const [
        overviewData,
        userStatsData,
        roomStatsData,
        messageStatsData,
        userListData,
        bannedUsersData,
        recentActivityData,
      ] = await Promise.all([
        analyticsApi.getOverview(token),
        analyticsApi.getUserStats(token, 30),
        analyticsApi.getRoomStats(token, 30),
        analyticsApi.getMessageStats(token, 30),
        analyticsApi.getUserList(token, 1, 20),
        analyticsApi.getBannedUsers(token),
        analyticsApi.getRecentActivity(token, 50),
      ]);

      setOverview(overviewData);
      setUserStats(userStatsData);
      setRoomStats(roomStatsData);
      setMessageStats(messageStatsData);
      setUserList(userListData);
      setBannedUsers(bannedUsersData);
      setRecentActivity(recentActivityData);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) return;

    try {
      const token = (session as any)?.backendToken;
      await analyticsApi.banUser(token, selectedUser.id, banReason);
      
      toast.success(`User ${selectedUser.name} has been banned`);
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
      loadAnalytics();
    } catch (err: any) {
      toast.error('Failed to ban user: ' + err.message);
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    try {
      const token = (session as any)?.backendToken;
      await analyticsApi.unbanUser(token, userId);
      
      toast.success(`User ${userName} has been unbanned`);
      loadAnalytics();
    } catch (err: any) {
      toast.error('Failed to unban user: ' + err.message);
    }
  };

  const openBanDialog = (user: any) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Card className="max-w-md border-red-900/20 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-500 flex-shrink-0" />
                <span className="truncate">Admin Control Panel</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden xs:block">
                System monitoring and user management
              </p>
            </div>
            <Badge variant="outline" className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border-purple-500/30 text-purple-400 flex-shrink-0">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Super </span>Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 sm:pt-4 md:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Total Users</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{overview?.totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">{overview?.activeUsersToday} active today</span>
                  <span className="xs:hidden">{overview?.activeUsersToday} today</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 sm:pt-4 md:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{overview?.totalMessages.toLocaleString()}</div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <span className="hidden xs:inline">{overview?.messagesLast24h} in last 24h</span>
                  <span className="xs:hidden">{overview?.messagesLast24h} / 24h</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 sm:pt-4 md:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Active Rooms</CardTitle>
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{overview?.activeRooms}</div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                <span className="text-[10px] sm:text-xs text-slate-500">
                  {overview?.systemRooms} system • {overview?.userRooms} custom
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 sm:pt-4 md:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400">Banned Users</CardTitle>
              <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{bannedUsers.length}</div>
              <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">Requires attention</span>
                  <span className="xs:hidden">Alert</span>
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 w-full sm:w-auto grid grid-cols-2 sm:flex h-auto gap-1 p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Users</span>
              <span className="xs:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="banned" className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-2 sm:px-4">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Banned Users</span>
              <span className="sm:hidden">Banned</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-2 sm:px-4">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Activity</span>
              <span className="xs:hidden">Live</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-800 text-xs sm:text-sm px-2 sm:px-4">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Analytics</span>
              <span className="xs:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-white text-base sm:text-lg md:text-xl">User Management</CardTitle>
                    <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                      View and manage all registered users
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 bg-slate-800 border-slate-700 text-white w-full sm:w-[200px] md:w-[300px] h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="border-0 sm:border border-slate-800 rounded-none sm:rounded-lg overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400 text-xs sm:text-sm">User</TableHead>
                        <TableHead className="text-slate-400 text-xs sm:text-sm">Email</TableHead>
                        <TableHead className="text-slate-400 text-xs sm:text-sm">Messages</TableHead>
                        <TableHead className="text-slate-400 text-xs sm:text-sm">Violations</TableHead>
                        <TableHead className="text-slate-400 text-xs sm:text-sm">Last Login</TableHead>
                        <TableHead className="text-slate-400 text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-slate-400 text-xs sm:text-sm text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userList?.users
                        .filter(user => 
                          !searchQuery || 
                          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((user) => (
                        <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/30">
                          <TableCell className="py-2 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-slate-700 sm:border-2">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="bg-slate-800 text-white text-xs sm:text-sm">
                                  {user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-medium text-white text-xs sm:text-sm truncate">{user.name || 'Anonymous'}</div>
                                <div className="text-[10px] sm:text-xs text-slate-500">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs sm:text-sm truncate max-w-[150px]">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                              {user.messageCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                `text-[10px] sm:text-xs px-1.5 sm:px-2 ${
                                user.violationCount === 0 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : user.violationCount < 5
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : user.violationCount < 10
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`
                              }
                            >
                              {user.violationCount || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{new Date(user.lastLogin).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.banned ? (
                              <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                <Ban className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">Banned</span>
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">Active</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!user.banned ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openBanDialog(user)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                              >
                                <Ban className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Ban User</span>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnbanUser(user.id, user.name)}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Unban</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banned Users Tab */}
          <TabsContent value="banned" className="space-y-4 sm:space-y-6">
            <Card className="border-slate-800 bg-slate-900/50 border-red-500/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Banned Users ({bannedUsers.length})
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Users who have been restricted from the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-green-500 mb-3 sm:mb-4" />
                    <p className="text-slate-400 text-sm sm:text-base">No banned users</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {bannedUsers.map((user) => (
                      <Card key={user.id} className="border-slate-800 bg-slate-800/50">
                        <CardContent className="pt-3 sm:pt-4 md:pt-6 p-3 sm:p-4 md:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-red-500/30 sm:border-2 flex-shrink-0">
                                <AvatarFallback className="bg-red-500/10 text-red-400 text-sm sm:text-base">
                                  {user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                  <h3 className="font-semibold text-white text-sm sm:text-base truncate">{user.name || user.email}</h3>
                                  <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                    Banned
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      `text-[10px] sm:text-xs px-1.5 sm:px-2 ${
                                      user.violationCount < 5
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                        : user.violationCount < 10
                                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                      }`
                                    }
                                  >
                                    {user.violationCount || 0}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-400 truncate">{user.email}</p>
                                <p className="text-xs sm:text-sm text-slate-500 truncate">
                                  Anonymous: {user.anonymousName}
                                </p>
                                {user.banReason && (
                                  <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                    <p className="text-xs sm:text-sm text-slate-400">
                                      <span className="font-medium text-red-400">Reason:</span> {user.banReason}
                                    </p>
                                  </div>
                                )}
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2">
                                  Last login: {new Date(user.lastLogin).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbanUser(user.id, user.name)}
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 w-full sm:w-auto flex-shrink-0"
                            >
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Unban User
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Activity Tab */}
          <TabsContent value="activity" className="space-y-4 sm:space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  Real-time message stream from all rooms
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px] pr-2 sm:pr-4">
                  <div className="space-y-2 sm:space-y-3">
                    {recentActivity.map((msg) => (
                      <Card key={msg.id} className="border-slate-800 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                        <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                                <span className="font-medium text-white text-xs sm:text-sm truncate">{msg.username}</span>
                                <Badge variant="outline" className="text-[10px] sm:text-xs border-slate-700 text-slate-400 px-1.5 sm:px-2">
                                  {msg.roomName}
                                </Badge>
                                <span className="text-[10px] sm:text-xs text-slate-500 ml-auto flex-shrink-0">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-300 break-words">{msg.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* User Growth Chart */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl">User Growth</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">New users over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ResponsiveContainer width="100%" height={250}>  
                    <AreaChart data={userStats?.newUsersPerDay || []}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Messages Chart */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl">Message Activity</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Messages sent over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={messageStats?.messagesPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Room Stats */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl">Room Creation</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">System vs Custom rooms over time</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={roomStats?.roomsPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="systemRooms" stroke="#06b6d4" strokeWidth={2} name="System" />
                      <Line type="monotone" dataKey="userRooms" stroke="#ec4899" strokeWidth={2} name="Custom" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Additional Stats */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg md:text-xl">Platform Statistics</CardTitle>
                  <CardDescription className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1">Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        </div>
                        <span className="text-slate-300 text-xs sm:text-sm md:text-base truncate">Avg. Messages/Room</span>
                      </div>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-white flex-shrink-0 ml-2">
                        {messageStats?.averageMessagesPerRoom.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-cyan-500/10 rounded-lg flex-shrink-0">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                        </div>
                        <span className="text-slate-300 text-xs sm:text-sm md:text-base truncate">Rooms with Messages</span>
                      </div>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-white flex-shrink-0 ml-2">
                        {messageStats?.totalRoomsWithMessages}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        </div>
                        <span className="text-slate-300 text-xs sm:text-sm md:text-base truncate">Active Users Today</span>
                      </div>
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-white flex-shrink-0 ml-2">
                        {overview?.activeUsersToday}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Ban User
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm">
              This will prevent the user from accessing the platform
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-800/50 rounded-lg">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-slate-700 sm:border-2">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback className="bg-slate-800 text-white text-sm sm:text-base">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm sm:text-base truncate">{selectedUser.name}</div>
                  <div className="text-xs sm:text-sm text-slate-400 truncate">{selectedUser.email}</div>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="reason" className="text-slate-300 text-xs sm:text-sm">Ban Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for banning this user..."
                  value={banReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBanReason(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              className="border-slate-700 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={!banReason.trim()}
              className="bg-red-500 hover:bg-red-600 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
