'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface PublicStats {
  totalUsers: number;
  totalMessages: number;
  activeRooms: number;
  messagesLast24h: number;
  messagesLastWeek: number;
  activeUsersToday: number;
  messagesPerDay: { date: string; count: number }[];
  popularRoomTypes: { roomType: string; count: number }[];
  peakHours: number[];
}

export default function PublicStatsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/public-stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getRoomTypeName = (type: string | null) => {
    const names: Record<string, string> = {
      confession: 'Confessions',
      city: 'City Chats',
      hostel: 'Hostel',
      exam: 'Exam Stress',
      latenight: 'Late Night',
      morning: 'Morning Vibes',
      matchday: 'Match Day',
    };
    return type ? names[type] || type : 'General';
  };

  const getHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Failed to load statistics</p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Radius Stats</h1>
              <p className="text-slate-400">Real-time platform statistics and insights</p>
            </div>
            <Button
              onClick={copyLink}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Stats
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-blue-400" />
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-0">
                  All Time
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">
                {formatNumber(stats.totalUsers)}
              </div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <div className="mt-2 flex items-center text-green-400 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.activeUsersToday} active today
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <MessageSquare className="h-8 w-8 text-purple-400" />
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-0">
                  All Time
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">
                {formatNumber(stats.totalMessages)}
              </div>
              <p className="text-slate-400 text-sm">Messages Sent</p>
              <div className="mt-2 flex items-center text-green-400 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {formatNumber(stats.messagesLast24h)} in last 24h
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Activity className="h-8 w-8 text-emerald-400" />
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-0">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">
                {stats.activeRooms}
              </div>
              <p className="text-slate-400 text-sm">Active Rooms</p>
              <div className="mt-2 flex items-center text-emerald-400 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Right now
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-orange-400" />
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-0">
                  7 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">
                {formatNumber(stats.messagesLastWeek)}
              </div>
              <p className="text-slate-400 text-sm">Weekly Messages</p>
              <div className="mt-2 flex items-center text-orange-400 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {Math.round(stats.messagesLastWeek / 7)}/day avg
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Messages Over Time */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Message Activity</CardTitle>
              <CardDescription className="text-slate-400">
                Daily messages over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.messagesPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => [value, 'Messages']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular Room Types */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Popular Rooms</CardTitle>
              <CardDescription className="text-slate-400">
                Most active room categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.popularRoomTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="roomType"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => getRoomTypeName(value).slice(0, 10)}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => [value, 'Messages']}
                    labelFormatter={(label) => getRoomTypeName(label)}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Peak Hours */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Peak Activity Hours</CardTitle>
            <CardDescription className="text-slate-400">
              Most active times on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.peakHours.map((hour, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-slate-800/50 px-6 py-4 rounded-lg border border-slate-700"
                >
                  <Clock className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {getHourLabel(hour)}
                    </div>
                    <div className="text-sm text-slate-400">Peak #{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center pb-8">
          <p className="text-slate-500 text-sm mb-4">
            Stats updated in real-time • Powered by Radius Analytics
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Home
            </Button>
            <Button
              onClick={fetchStats}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh Stats
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
