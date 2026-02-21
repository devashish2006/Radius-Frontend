"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Users,
  Loader2,
  AlertCircle,
  Clock,
  Info,
  Shield,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { wsService } from "@/lib/websocket-service";
import { roomsApi } from "@/lib/api-service";
import { initializeUser, getUserLocation, calculateDistance } from "@/lib/user-utils";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/countdown-timer";
import { useSession } from "next-auth/react";
import { WaitingForUsers } from "@/components/waiting-for-users";

interface Message {
  username: string;
  message: string;
  time: Date | string;
  isSystem?: boolean;
}

function ChatRoomPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [slowModeActive, setSlowModeActive] = useState(false);
  const [slowModeTimer, setSlowModeTimer] = useState(0);
  const slowModeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [assignedUsername, setAssignedUsername] = useState<string | null>(null);
  const [isLastUser, setIsLastUser] = useState(false);
  const userDataRef = useRef<{ userId: string; username: string } | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // Room details
  const roomId = searchParams.get("id");
  const roomName = searchParams.get("name");
  const roomType = searchParams.get("type");
  const [userData, setUserData] = useState<{ userId: string; username: string } | null>(null);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  useEffect(() => {
    if (!roomId) {
      router.push("/rooms");
      return;
    }

    // Wait for session to be loaded
    if (status === "loading") {

      return;
    }

    if (status === "unauthenticated") {

      // Store the intended room URL in sessionStorage for redirect after login
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        sessionStorage.setItem('redius_redirect_after_login', currentUrl);
      }
      toast.error("Please login first", {
        description: "You need to be logged in to join this room",
        duration: 3000,
      });
      router.push("/");
      return;
    }

    const user = initializeUser();
    setUserData(user);
    userDataRef.current = user;
    roomIdRef.current = roomId;

    // Load room details and connect
    loadRoomAndConnect(user);

    return () => {
      // Cleanup on unmount
      if (userDataRef.current && roomIdRef.current) {
        wsService.leaveRoom(roomIdRef.current, userDataRef.current.userId);
      }
      wsService.removeAllListeners();
      if (slowModeTimerRef.current) {
        clearInterval(slowModeTimerRef.current);
      }
    };
  }, [roomId, status, session]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRoomAndConnect = async (user: { userId: string; username: string }) => {
    if (!roomId) return;

    try {
      setLoading(true);
      setError(null);

      // Load room details
      const details = await roomsApi.getRoomDetails(roomId);
      
      if (!details) {
        setError("This room is no longer available or has expired");
        toast.error("Room unavailable", {
          description: "This room has expired. Redirecting to rooms page...",
        });
        setTimeout(() => router.push("/rooms"), 2000);
        return;
      }

      // Check if user is within radius of the room (5km)
      if (details.latitude && details.longitude) {
        try {
          const userLocation = await getUserLocation();
          if (userLocation) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              details.latitude,
              details.longitude
            );

            // If user is more than 5km away, show error
            if (distance > 5) {
              setError(`You are ${distance}km away from this room`);
              toast.error("Too far from room", {
                description: `You must be within 5km of the room to join. You are ${distance}km away.`,
                duration: 5000,
              });
              setTimeout(() => router.push("/rooms"), 3000);
              return;
            }
          }
        } catch (err) {
          console.error("Error checking user location:", err);
          // Continue even if location check fails
        }
      }
      
      setRoomDetails(details);
      // Don't set activeUsers from API - wait for WebSocket user-count event for real-time data

      // Load existing messages from database
      try {
        const existingMessages = await roomsApi.getRoomMessages(roomId, 50);
        const formattedMessages = existingMessages.map((msg: any) => ({
          username: msg.username,
          message: msg.message,
          time: new Date(msg.created_at),
          isSystem: false,
        }));
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error loading messages:", err);
        // Continue even if messages fail to load
      }

      // Connect to WebSocket with JWT token
      const token = (session as any)?.backendToken;
      
      if (!token) {
        setError("Authentication token not found");
        toast.error("Authentication Error", {
          description: "Please sign in again",
        });
        setTimeout(() => router.push("/"), 2000);
        return;
      }

      const socket = wsService.connect(token);

      // Set up ALL event listeners BEFORE joining the room
      // This prevents race conditions where events fire before listeners are ready
      
      // Listen for connection events
      wsService.onConnect(() => {

        setConnected(true);
        setError(null);
        wsService.joinRoom({ roomId });
      });

      wsService.onDisconnect((reason) => {

        setConnected(false);
        if (reason !== 'io client disconnect') {
          toast.warning("Connection Lost", {
            description: "Attempting to reconnect...",
            duration: 3000,
          });
        }
      });

      wsService.onReconnect(() => {

        setConnected(true);
        toast.success("Reconnected", {
          description: "You're back online!",
          duration: 2000,
        });
      });
      
      // Listen for your assigned identity
      wsService.onYourIdentity((data) => {
        setAssignedUsername(data.username);
        // Show welcome toast
        toast.success(`Welcome ${data.username}!`, {
          description: `You joined ${roomName || details.name || "the room"}`,
          duration: 3000,
        });
      });

      // Listen for messages
      wsService.onMessage((data) => {

        setMessages((prev) => [
          ...prev,
          {
            username: data.username,
            message: data.message,
            time: data.time,
          },
        ]);
      });

      // Listen for user count updates
      wsService.onUserCount((count) => {

        setActiveUsers(count);
        
        // Check if user is now the last one in a user room
        if (count === 1 && details?.type === 'user') {
          setIsLastUser(true);
        } else if (count > 1) {
          setIsLastUser(false);
        }
      });

      // Listen for user joined events
      wsService.onUserJoined((data) => {

        // Show toast notification for other users joining
        toast.info(`${data.username} joined the room`, {
          duration: 2000,
        });
      });

      // Listen for user left events
      wsService.onUserLeft((data) => {

        // Show toast notification for users leaving
        toast.error(`${data.username} left the room`, {
          duration: 2000,
        });
      });

      // Listen for slow mode notifications
      wsService.onSlowMode((data) => {
        setSlowModeActive(true);
        setSlowModeTimer(data.secondsLeft);

        if (slowModeTimerRef.current) {
          clearInterval(slowModeTimerRef.current);
        }

        slowModeTimerRef.current = setInterval(() => {
          setSlowModeTimer((prev) => {
            if (prev <= 1) {
              setSlowModeActive(false);
              if (slowModeTimerRef.current) {
                clearInterval(slowModeTimerRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      });

      // Listen for room closing notification
      wsService.onRoomClosing((data) => {

        toast.error("Room Closed", {
          description: data.message,
          duration: 2000,
        });
        
        // Disconnect and redirect immediately
        wsService.removeAllListeners();
        wsService.disconnect();
        router.push("/rooms");
      });

      // Listen for room expired notification (auto-deleted after 2 hours)
      wsService.onRoomExpired((data) => {

        toast.error("Room Expired", {
          description: data.message,
          duration: 3000,
        });
        
        // Disconnect and redirect immediately
        wsService.removeAllListeners();
        wsService.disconnect();
        router.push("/rooms");
      });

      // Listen for last user warning
      wsService.onLastUserWarning((data) => {

        setIsLastUser(true);
        toast.warning("Last User", {
          description: data.message,
          duration: 5000,
        });
      });

      // Listen for message blocked notifications (content moderation)
      wsService.onMessageBlocked((data) => {

        toast.error("Message Blocked", {
          description: data.message,
          duration: 3000,
        });
      });

      // If already connected, join immediately
      if (socket.connected) {

        setConnected(true);
        wsService.joinRoom({ roomId });
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading room:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load room";
      const errorType = (err as any)?.type;
      
      // Handle specific error types
      if (errorType === 'ROOM_NOT_FOUND' || 
          errorMessage.includes("not found") || 
          errorMessage.includes("expired")) {
        setError("This room is no longer available");
        toast.error("Room Not Found", {
          description: "This room has expired or been deleted. Redirecting...",
          duration: 3000,
        });
        
        // Disconnect WebSocket if connected
        try {
          wsService.removeAllListeners();
          wsService.disconnect();
        } catch (e) {
          console.error("Error disconnecting:", e);
        }
        
        // Redirect after a short delay
        setTimeout(() => router.push("/rooms"), 2000);
      } else if (errorMessage.includes("Authentication")) {
        setError("Authentication failed");
        toast.error("Authentication Error", {
          description: "Please sign in again to continue.",
          duration: 3000,
        });
        setTimeout(() => router.push("/"), 2000);
      } else {
        setError(errorMessage);
        toast.error("Connection Failed", {
          description: errorMessage || "Unable to connect to room. Please try again.",
          duration: 4000,
        });
      }
      
      setLoading(false);
    }
  };

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        username: "System",
        message: text,
        time: new Date(),
        isSystem: true,
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !userData || !roomId) return;

    if (slowModeActive) {
      toast.error("Slow mode active", {
        description: `Please wait ${slowModeTimer} seconds`,
      });
      return;
    }

    try {
      // Backend handles slow mode
      wsService.sendMessage({
        roomId,
        message: message.trim(),
      });

      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleWaitingTimeout = async () => {

    toast.error("Room Closed", {
      description: "No one joined in time. Taking you back to the rooms page...",
      duration: 3000,
    });

    try {
      // Leave the room gracefully
      if (userDataRef.current && roomIdRef.current) {
        wsService.leaveRoom(roomIdRef.current, userDataRef.current.userId);
      }
      
      // Disconnect WebSocket
      wsService.removeAllListeners();
      wsService.disconnect();

      // Delete the room if it's a user room
      if (roomId && roomDetails?.isUserRoom) {
        try {
          await roomsApi.deleteRoom(roomId);

        } catch (err) {
          console.error("Error deleting room:", err);
          // Continue with redirect even if deletion fails
        }
      }
    } catch (err) {
      console.error("Error during timeout cleanup:", err);
    }

    // Redirect after a short delay
    setTimeout(() => {
      router.push("/rooms");
    }, 1500);
  };

  const handleManualLeave = async () => {

    try {
      // Leave the room gracefully
      if (userDataRef.current && roomIdRef.current) {
        wsService.leaveRoom(roomIdRef.current, userDataRef.current.userId);
      }
      
      // Disconnect WebSocket
      wsService.removeAllListeners();
      wsService.disconnect();

      // Delete the room if it's a user room
      if (roomId && roomDetails?.isUserRoom) {
        try {
          await roomsApi.deleteRoom(roomId);

        } catch (err) {
          console.error("Error deleting room:", err);
          // Continue with redirect even if deletion fails
        }
      }
    } catch (err) {
      console.error("Error during manual leave cleanup:", err);
    }

    // Redirect immediately
    router.push("/rooms");
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    const index = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <h2 className="text-2xl font-bold">Connecting to Room</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isRoomNotFound = error.includes("no longer available") || error.includes("expired") || error.includes("not found");
    const isAuthError = error.includes("Authentication");
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>
                {isRoomNotFound ? "Room Not Found" : isAuthError ? "Authentication Error" : "Connection Error"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            {isRoomNotFound && (
              <p className="text-sm text-muted-foreground/80">
                This room may have expired after 2 hours of inactivity or was deleted by its creator.
              </p>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push(isAuthError ? "/" : "/rooms")} 
                variant="outline" 
                className="flex-1"
              >
                {isAuthError ? "Sign In" : "Back to Rooms"}
              </Button>
              {!isRoomNotFound && !isAuthError && (
                <Button onClick={() => window.location.reload()} className="flex-1">
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show waiting screen when there are less than 2 users in the room
  if (activeUsers < 2 && connected) {
    return (
      <div className="h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
        <WaitingForUsers 
          roomName={roomName || roomDetails?.name} 
          roomType={roomType ?? undefined}
          onTimeout={handleWaitingTimeout}
          onLeave={handleManualLeave}
          roomId={roomId || ''}
          roomUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/rooms/chat?id=${roomId}&name=${encodeURIComponent(roomName || 'Chat Room')}&type=${roomType || 'chat'}`}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => router.push("/rooms")} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">{roomName || roomDetails?.name || "Chat Room"}</h1>
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <Badge variant={connected ? "default" : "secondary"} className="text-[10px] sm:text-xs px-1.5 py-0 sm:px-2">
                    {connected ? "Connected" : "Connecting..."}
                  </Badge>
                  {roomType && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 hidden xs:inline-flex">
                      {roomType}
                    </Badge>
                  )}
                  {roomDetails?.expiresAt && roomDetails?.isUserRoom && (
                    <CountdownTimer 
                      expiresAt={roomDetails.expiresAt} 
                      showIcon={true}
                      variant="secondary"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
              {/* WhatsApp Share Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      onClick={() => {
                        const roomUrl = `${window.location.origin}/rooms/chat?id=${roomId}&name=${encodeURIComponent(roomName || 'Chat Room')}&type=${roomType || 'chat'}`;
                        const message = `🎯 Join me on Redius!\n\n📍 Room: ${roomName || 'Chat Room'}\n💬 Anonymous chat nearby\n\n🔗 Click to join: ${roomUrl}`;
                        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                        toast.success('Opening WhatsApp...');
                      }}
                    >
                      <Share2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Share room via WhatsApp</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isLastUser && roomDetails?.isUserRoom && (
                <Badge variant="destructive" className="gap-1 sm:gap-2 animate-pulse text-[10px] sm:text-xs px-1.5 sm:px-2 hidden sm:flex">
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Last User
                </Badge>
              )}
              
              {slowModeActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="gap-1 sm:gap-2 text-[10px] sm:text-xs px-1.5 sm:px-2">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {slowModeTimer}s
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Slow mode: Wait {slowModeTimer}s before sending next message</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Card className="px-2 py-1 sm:px-3 sm:py-1.5 transition-all hover:shadow-md">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="relative">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-primary">{activeUsers}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline">online</span>
                      </div>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{activeUsers} {activeUsers === 1 ? 'user' : 'users'} currently in this room</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Last User Warning Banner */}
      {isLastUser && roomDetails?.isUserRoom && (
        <div className="border-b bg-destructive/10 backdrop-blur">
          <div className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-destructive">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="font-medium text-center">
                <span className="hidden sm:inline">You are the last person in this room. The room will be permanently deleted when you leave.</span>
                <span className="sm:hidden">Last user - room will delete when you leave</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6">
        <div className="container mx-auto max-w-4xl space-y-3 sm:space-y-4">
          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <p className="font-medium">Chat Guidelines</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Be respectful. Anonymous chat - no personal info sharing. Slow mode: 5s cooldown between messages.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          {messages.map((msg, index) => (
            <div key={index} className={msg.isSystem ? "flex justify-center" : ""}>
              {msg.isSystem ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs py-0.5 sm:py-1 px-2 sm:px-3">
                  {msg.message}
                </Badge>
              ) : (
                <div
                  className={`flex gap-2 sm:gap-3 ${
                    msg.username === assignedUsername ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 ${getAvatarColor(msg.username)}`}>
                    <AvatarFallback className="text-white font-semibold text-xs sm:text-sm">
                      {msg.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex-1 max-w-[75%] sm:max-w-[70%] ${
                      msg.username === assignedUsername ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                      <span className="text-xs sm:text-sm font-medium truncate">{msg.username}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                        {formatTimestamp(msg.time)}
                      </span>
                    </div>
                    <Card
                      className={
                        msg.username === assignedUsername
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }
                    >
                      <CardContent className="py-1.5 sm:py-2 px-2.5 sm:px-3 md:px-4">
                        <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 md:py-4 max-w-4xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder={
                  slowModeActive
                    ? `Wait ${slowModeTimer}s to send message...`
                    : "Type a message..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!connected || slowModeActive}
                className="pr-12 sm:pr-16 text-sm h-9 sm:h-10"
                maxLength={500}
              />
              {slowModeActive && (
                <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    {slowModeTimer}s
                  </Badge>
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !connected || slowModeActive}
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <span className="truncate">You: {assignedUsername || "Connecting..."}</span>
              <Separator orientation="vertical" className="h-3 sm:h-4 hidden xs:block" />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden xs:inline">Anonymous</span>
              </div>
            </div>
            <span className="flex-shrink-0 ml-2">{message.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading chat room...</p>
        </div>
      </div>
    }>
      <ChatRoomPageContent />
    </Suspense>
  );
}
