"use client";

import { 
  MessageCircle, 
  MapPin, 
  Shield, 
  Zap, 
  Users, 
  Heart,
  Sparkles,
  ArrowRight,
  Github,
  Instagram,
  Twitter,
  CheckCircle2,
  Activity,
  BarChart3,
  LogIn,
  Moon,
  Sun,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/page-loader";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { ActiveUsersDialog } from "@/components/active-users-dialog";
import { AnimatedWorldMap } from "@/components/animated-world-map";
import { BackgroundMusic } from "@/components/background-music";
import { motion } from "framer-motion";

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
      title: "Location-Based Chat",
      description: "Discover and join chat rooms within a customizable proximity radius from your location.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: MessageCircle,
      title: "Themed Rooms",
      description: "Multiple themed conversation spaces for different contexts and times of day.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Shield,
      title: "Anonymous & Secure",
      description: "Chat with auto-generated anonymous identities. Your personal information stays private.",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Zap,
      title: "Real-Time Messaging",
      description: "Instant message delivery with WebSocket technology for seamless communication.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    }
  ];

  const systemRooms = [
    { name: "Confession Room", description: "Anonymous confessions and thoughts", icon: MessageCircle, color: "text-purple-500" },
    { name: "City Talk", description: "Discuss local events and city life", icon: MapPin, color: "text-blue-500" },
    { name: "Campus Life", description: "Student discussions and experiences", icon: Users, color: "text-green-500" },
    { name: "After Hours", description: "Late night conversations", icon: Moon, color: "text-indigo-500" },
    { name: "Morning Chat", description: "Start your day with morning talks", icon: Sun, color: "text-yellow-500" },
    { name: "Sports Zone", description: "Sports discussions and live reactions", icon: Activity, color: "text-red-500" },
    { name: "Work & Career", description: "Professional networking and advice", icon: Briefcase, color: "text-cyan-500" }
  ];



  return (
    <>
      {isNavigating && <PageLoader />}
      
      {/* Background Music - Only for unauthenticated users */}
      {status === "unauthenticated" && <BackgroundMusic />}
      
      {/* Active Users Dialog */}
      <ActiveUsersDialog 
        open={showActiveUsersDialog} 
        onOpenChange={setShowActiveUsersDialog} 
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 sm:py-12 md:py-20 lg:py-28">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 max-w-4xl mx-auto">
            <Badge variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
              Location-Based Real-Time Chat Platform
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight px-2">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                Radius
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              A location-based anonymous chat platform connecting people within your proximity through themed conversation rooms.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-4 px-4">
              {status === "loading" ? (
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
                  disabled
                >
                  Loading...
                </Button>
              ) : status === "authenticated" ? (
                <Button 
                  size="lg" 
                  className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto group shadow-lg hover:shadow-xl transition-all"
                  onClick={() => router.push("/rooms")}
                >
                  Continue to Rooms
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto group shadow-lg hover:shadow-xl transition-all bg-white text-black hover:bg-gray-100"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
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
                    className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
                    onClick={() => setShowActiveUsersDialog(true)}
                  >
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    See Active Users
                  </Button>
                </>
              )}
            </div>

            {/* Security Notice */}
            {status === "unauthenticated" && (
              <div className="pt-6 sm:pt-8 max-w-md mx-auto px-4">
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

      {/* Animated World Map Section */}
      <section className="relative w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Section Header */}
        <div className="container mx-auto px-4 text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16 relative z-10">
          <Badge variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm mb-4 sm:mb-6 border-blue-500/30 bg-blue-500/10">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
            Global Room Network
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white px-4">
            Discover Rooms{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Around You
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto px-4">
            Watch how our proximity-based system connects people in real-time. 
            Each dot represents an active chat room, with pulsing circles showing discovery radius.
          </p>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px]">
          <AnimatedWorldMap />
        </div>
        
        {/* Overlay gradients */}
        <div className="absolute inset-x-0 top-0 h-32 sm:h-40 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
        
        {/* How It Works Cards */}
        <div className="container mx-auto px-4 relative z-10 mt-6 sm:mt-8 md:mt-12 lg:mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">50-200m Radius</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Rooms are discovered within a customizable proximity range. The pulsing circles show the active detection area.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 sm:mb-4">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Instant Connection</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  As you move, new rooms appear automatically. Real-time proximity detection keeps your feed fresh.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:border-pink-500/50 transition-all duration-300">
              <CardContent className="pt-4 sm:pt-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-3 sm:mb-4">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Smart Clustering</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Multiple nearby rooms are linked together, creating vibrant conversation networks in your area.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8 md:mb-12 lg:mb-16">
          <Badge variant="secondary" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
            Features
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4">Everything You Need</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Seamless real-time communication designed for authentic connections
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
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



      {/* System Rooms Section */}
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 mb-6 sm:mb-8 md:mb-12 lg:mb-16">
          <Badge variant="secondary" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
            System Rooms
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4">Available Room Types</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Join conversations in themed rooms that match your interests and context
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-7xl mx-auto">
          {systemRooms.map((room, index) => (
            <Card key={index} className="relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group border-2">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                room.color === 'text-purple-500' ? 'from-purple-500/10 via-purple-500/5 to-transparent' :
                room.color === 'text-blue-500' ? 'from-blue-500/10 via-blue-500/5 to-transparent' :
                room.color === 'text-green-500' ? 'from-green-500/10 via-green-500/5 to-transparent' :
                room.color === 'text-orange-500' ? 'from-orange-500/10 via-orange-500/5 to-transparent' :
                room.color === 'text-indigo-500' ? 'from-indigo-500/10 via-indigo-500/5 to-transparent' :
                room.color === 'text-yellow-500' ? 'from-yellow-500/10 via-yellow-500/5 to-transparent' :
                room.color === 'text-red-500' ? 'from-red-500/10 via-red-500/5 to-transparent' :
                'from-cyan-500/10 via-cyan-500/5 to-transparent'
              } opacity-50`} />
              
              <CardHeader className="pb-3 relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                  room.color === 'text-purple-500' ? 'from-purple-500/20 to-purple-600/20 text-purple-600' :
                  room.color === 'text-blue-500' ? 'from-blue-500/20 to-blue-600/20 text-blue-600' :
                  room.color === 'text-green-500' ? 'from-green-500/20 to-green-600/20 text-green-600' :
                  room.color === 'text-orange-500' ? 'from-orange-500/20 to-orange-600/20 text-orange-600' :
                  room.color === 'text-indigo-500' ? 'from-indigo-500/20 to-indigo-600/20 text-indigo-600' :
                  room.color === 'text-yellow-500' ? 'from-yellow-500/20 to-yellow-600/20 text-yellow-600' :
                  room.color === 'text-red-500' ? 'from-red-500/20 to-red-600/20 text-red-600' :
                  'from-cyan-500/20 to-cyan-600/20 text-cyan-600'
                } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ring-2 ring-current/20`}>
                  <room.icon className="w-7 h-7" />
                </div>
                <CardTitle className="text-lg">
                  <span>{room.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-sm text-muted-foreground leading-relaxed">{room.description}</p>
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
      <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-2xl">
          <CardHeader className="text-center space-y-3 sm:space-y-4 md:space-y-6 pb-4 sm:pb-6 md:pb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
            </div>
            <Badge variant="secondary" className="mx-auto text-xs sm:text-sm">Join The Conversation</Badge>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Ready to Connect?</CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Start connecting with people nearby through anonymous, location-based conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pb-4 sm:pb-6 md:pb-8">
            {status === "loading" ? (
              <Button 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6"
                disabled
              >
                Loading...
              </Button>
            ) : status === "authenticated" ? (
              <Button 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 shadow-lg hover:shadow-xl transition-all"
                onClick={() => router.push("/rooms")}
              >
                Launch App
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 shadow-lg hover:shadow-xl transition-all bg-white text-black hover:bg-gray-100"
                onClick={handleGoogleLogin}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            )}
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6">
              View on GitHub
              <Github className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-8 sm:mt-12 md:mt-16 lg:mt-20 bg-muted/20">
        <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                Radius
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A proximity-based anonymous chat platform for real-time conversations with people nearby.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg">Quick Links</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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

            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg">Connect with Devashish</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
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

          <div className="pt-4 sm:pt-6 md:pt-8 border-t text-center space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2026 Radius. Crafted with passion and code.
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Heart className="w-3 h-3 text-red-500" />
              Built by Devashish
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Stats Button */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => router.push('/stats')}
          size="lg"
          className="rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-2 border-white/20 backdrop-blur-sm group"
        >
          <BarChart3 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Live Stats</span>
        </Button>
      </motion.div>
      </div>
    </>
  );
}

