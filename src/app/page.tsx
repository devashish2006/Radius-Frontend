"use client";

import { 
  MessageCircle, 
  MapPin, 
  Clock, 
  Shield, 
  Zap, 
  Users, 
  Heart,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Github,
  Instagram,
  Twitter,
  CheckCircle2,
  BarChart3,
  Activity,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/page-loader";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { ActiveUsersDialog } from "@/components/active-users-dialog";

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showActiveUsersDialog, setShowActiveUsersDialog] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const timer = setTimeout(() => setProgress(92), 500);
    return () => clearTimeout(timer);
  }, []);

  // Show active users dialog after 2 seconds if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        setShowActiveUsersDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Redirect to rooms if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      setIsNavigating(true);
      setTimeout(() => {
        router.push("/rooms");
      }, 1200);
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: "/rooms" });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login with Google");
    }
  };

  const features = [
    {
      icon: MapPin,
      title: "Location-Based Discovery",
      description: "Automatically discover themed chat rooms within your area. Connect with people nearby in real-time conversations.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: MessageCircle,
      title: "Themed Conversations",
      description: "7 unique room types for every mood: Confessions, City Talk, Hostel Stories, Exam Reactions, Late Night Thoughts, and more.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Shield,
      title: "Anonymous & Safe",
      description: "Express yourself freely with auto-generated anonymous names. Your privacy is our priority.",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Clock,
      title: "Time-Sensitive Rooms",
      description: "Special rooms activate at specific times: Late Night vibes (11PM-2AM), Morning Thoughts (6AM-9AM).",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: Zap,
      title: "Instant Real-Time",
      description: "Experience zero-delay messaging with live user counts. Every message delivered instantly.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Users,
      title: "Create Custom Rooms",
      description: "Build your own spaces with unique titles. Quality-controlled with a 5-room limit per area.",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  const systemRooms = [
    { name: "🤫 Confession Room", expiry: "24h", description: "Say what you never said out loud", icon: MessageCircle },
    { name: "🏙️ Your City Room", expiry: "24h", description: "Talk about your city", icon: MapPin },
    { name: "🎓 Hostel Masti", expiry: "24h", description: "College chaos & stories", icon: Sparkles },
    { name: "📚 Exam / Result Room", expiry: "12h", description: "Exam anxiety & reactions", icon: Clock },
    { name: "🌙 Late Night Thoughts", expiry: "6h", description: "Deep talks after 11 PM", icon: Clock },
    { name: "☀️ Morning Thoughts", expiry: "6h", description: "Morning vibes 6-9 AM", icon: Sparkles },
    { name: "🏏 Match Day Live", expiry: "8h", description: "Live sports reactions", icon: Activity }
  ];

  // Chart data for engagement visualization
  const weeklyEngagement = [
    { day: "Mon", conversations: 142 },
    { day: "Tue", conversations: 198 },
    { day: "Wed", conversations: 235 },
    { day: "Thu", conversations: 189 },
    { day: "Fri", conversations: 312 },
    { day: "Sat", conversations: 278 },
    { day: "Sun", conversations: 245 },
  ];

  const roomPopularity = [
    { room: "Confession", engagement: 89 },
    { room: "City Talk", engagement: 76 },
    { room: "Hostel", engagement: 92 },
    { room: "Exam Room", engagement: 68 },
    { room: "Late Night", engagement: 85 },
  ];

  return (
    <>
      {isNavigating && <PageLoader />}
      
      {/* Active Users Dialog */}
      <ActiveUsersDialog 
        open={showActiveUsersDialog} 
        onOpenChange={setShowActiveUsersDialog} 
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Location-Based Real-Time Chat Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                Radius
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect with people around you through anonymous, themed chat rooms. 
              Express yourself freely in real-time conversations.
            </p>

            <div className="flex flex-wrap gap-4 justify-center items-center pt-4">
              {status === "loading" ? (
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  disabled
                >
                  Loading...
                </Button>
              ) : status === "authenticated" ? (
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 group shadow-lg hover:shadow-xl transition-all"
                  onClick={() => router.push("/rooms")}
                >
                  Continue to Rooms
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 group shadow-lg hover:shadow-xl transition-all bg-white text-black hover:bg-gray-100"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6"
                    onClick={() => setShowActiveUsersDialog(true)}
                  >
                    <Activity className="w-5 h-5 mr-2" />
                    See Active Users
                  </Button>
                </>
              )}
            </div>

            {/* Security Notice */}
            {status === "unauthenticated" && (
              <div className="pt-8 max-w-md mx-auto">
                <Card className="border-2 border-green-500/20 bg-green-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                      <div className="text-left space-y-1">
                        <p className="text-sm font-medium">Secure & Anonymous</p>
                        <p className="text-xs text-muted-foreground">
                          Sign in for security, chat with anonymous names. We only use your email for authentication.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Connection Status */}
            <div className="pt-8 max-w-md mx-auto">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Platform Online & Ready</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    All systems operational • Real-time messaging active
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="px-4 py-2">
            <Heart className="w-4 h-4 mr-2 inline" />
            Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamless real-time communication designed for authentic connections
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Engagement Analytics Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 -mx-4">
        <div className="text-center space-y-4 mb-16 px-4">
          <Badge variant="secondary" className="px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2 inline" />
            Platform Engagement
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Conversations That Matter</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how Radius brings people together through meaningful, real-time interactions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
          {/* Weekly Conversations Chart */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Weekly Activity
              </CardTitle>
              <CardDescription>Conversations started across all rooms</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  conversations: {
                    label: "Conversations",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyEngagement}>
                    <defs>
                      <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorConversations)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Room Popularity Chart */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Room Engagement
              </CardTitle>
              <CardDescription>Most active conversation spaces</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  engagement: {
                    label: "Engagement Score",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roomPopularity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis 
                      dataKey="room" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="engagement" 
                      fill="hsl(var(--primary))" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Highlights */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <MessageCircle className="w-8 h-8 mx-auto text-primary mb-3" />
                <div className="text-3xl font-bold">2.4K+</div>
                <div className="text-sm text-muted-foreground">Daily Messages</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Users className="w-8 h-8 mx-auto text-primary mb-3" />
                <div className="text-3xl font-bold">850+</div>
                <div className="text-sm text-muted-foreground">Active Conversations</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-primary mb-3" />
                <div className="text-3xl font-bold">7</div>
                <div className="text-sm text-muted-foreground">Themed Rooms</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* System Rooms Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            System Rooms
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">Themed Chat Rooms</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seven unique spaces that automatically appear in your area, each with its own vibe
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {systemRooms.map((room, index) => (
            <Card key={index} className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <room.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{room.name}</span>
                  <Badge variant="outline" className="text-xs">{room.expiry}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{room.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 max-w-2xl mx-auto border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Smart Room Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rooms automatically refresh to keep conversations relevant and engaging. 
              Time-sensitive spaces appear only during their active hours, creating special moments 
              for late-night thoughts or morning vibes.
            </p>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Room Freshness Score</span>
                <span className="text-muted-foreground font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <Badge variant="secondary" className="mx-auto">Join The Conversation</Badge>
            <CardTitle className="text-3xl md:text-5xl">Ready to Connect?</CardTitle>
            <CardDescription className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Experience authentic conversations with people nearby. 
              Anonymous, safe, and always interesting. Start chatting in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center pb-8">
            {status === "loading" ? (
              <Button 
                size="lg" 
                className="text-lg px-10 py-6"
                disabled
              >
                Loading...
              </Button>
            ) : status === "authenticated" ? (
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all"
                onClick={() => router.push("/rooms")}
              >
                Launch App
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all bg-white text-black hover:bg-gray-100"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            )}
            <Button size="lg" variant="outline" className="text-lg px-10 py-6">
              View on GitHub
              <Github className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                Radius
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Location-based real-time chat platform. Connect with people around you through 
                anonymous, themed conversations that matter.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" />
                  About Radius
                </li>
                <li className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" />
                  Features
                </li>
                <li className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" />
                  Documentation
                </li>
                <li className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" />
                  Privacy Policy
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Connect with Devashish</h4>
              <p className="text-sm text-muted-foreground">
                Follow the creator and stay updated with latest developments
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://github.com/devashish2006" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-muted hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110 border border-transparent hover:border-primary/30"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/devashish2006" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-muted hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110 border border-transparent hover:border-primary/30"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://x.com/devashish2006" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-muted hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110 border border-transparent hover:border-primary/30"
                  aria-label="X (Twitter)"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © 2026 Radius. Crafted with passion and code.
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Heart className="w-3 h-3 text-red-500" />
              Built by Devashish
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}

