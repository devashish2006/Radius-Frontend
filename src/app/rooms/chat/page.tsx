"use client";

import { useState, useEffect, useRef } from "react";
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
import { initializeUser } from "@/lib/user-utils";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/countdown-timer";

interface Message {
  username: string;
  message: string;
  time: Date | string;
  isSystem?: boolean;
}

export default function ChatRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

    const user = initializeUser();
    setUserData(user);

    // Load room details and connect
    loadRoomAndConnect(user);

    return () => {
      // Cleanup on unmount
      if (userData && roomId) {
        wsService.leaveRoom(roomId, userData.userId);
      }
      wsService.removeAllListeners();
      if (slowModeTimerRef.current) {
        clearInterval(slowModeTimerRef.current);
      }
    };
  }, [roomId]);

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
      setRoomDetails(details);
      setActiveUsers(details.activeUserCount);

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

      // Connect to WebSocket
      const socket = wsService.connect();

      socket.on("connect", () => {
        setConnected(true);
        // Join room (backend only needs roomId)
        wsService.joinRoom({ roomId });
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
      });

      // Listen for user joined events
      wsService.onUserJoined((data) => {
        // Show toast notification for other users joining
        toast.info(`${data.username} joined the room`, {
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

      setLoading(false);
    } catch (err) {
      console.error("Error loading room:", err);
      setError(err instanceof Error ? err.message : "Failed to load room");
      setLoading(false);
      toast.error("Failed to connect to room");
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>Connection Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/rooms")} variant="outline" className="flex-1">
                Back to Rooms
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/rooms")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{roomName || roomDetails?.name || "Chat Room"}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={connected ? "default" : "secondary"} className="text-xs">
                    {connected ? "Connected" : "Connecting..."}
                  </Badge>
                  {roomType && (
                    <Badge variant="outline" className="text-xs">
                      {roomType}
                    </Badge>
                  )}
                  {roomDetails?.expiresAt && (
                    <CountdownTimer 
                      expiresAt={roomDetails.expiresAt} 
                      showIcon={true}
                      variant="secondary"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {slowModeActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="gap-2">
                        <Clock className="w-3 h-3" />
                        {slowModeTimer}s
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Slow mode: Wait {slowModeTimer}s before sending next message</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Card className="px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{activeUsers}</span>
                  <span className="text-xs text-muted-foreground">online</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-4xl space-y-4">
          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Chat Guidelines</p>
                  <p className="text-muted-foreground">
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
                <Badge variant="secondary" className="text-xs py-1">
                  {msg.message}
                </Badge>
              ) : (
                <div
                  className={`flex gap-3 ${
                    msg.username === assignedUsername ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className={`w-10 h-10 ${getAvatarColor(msg.username)}`}>
                    <AvatarFallback className="text-white font-semibold">
                      {msg.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex-1 max-w-[70%] ${
                      msg.username === assignedUsername ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.username}</span>
                      <span className="text-xs text-muted-foreground">
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
                      <CardContent className="py-2 px-4">
                        <p className="text-sm break-words">{msg.message}</p>
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
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center gap-3">
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
                className="pr-12"
                maxLength={500}
              />
              {slowModeActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {slowModeTimer}s
                  </Badge>
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !connected || slowModeActive}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>You: {assignedUsername || "Connecting..."}</span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Anonymous</span>
              </div>
            </div>
            <span>{message.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}
