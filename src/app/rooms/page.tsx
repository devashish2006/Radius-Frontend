"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  MapPin,
  Clock,
  Users,
  Plus,
  Sparkles,
  Lock,
  Activity,
  ArrowLeft,
  Info,
  Loader2,
  AlertCircle,
  LogOut,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { roomsApi } from "@/lib/api-service";
import { Room as ApiRoom, DEFAULT_LOCATION } from "@/lib/api-config";
import { initializeUser, getUserLocation, calculateDistance } from "@/lib/user-utils";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/countdown-timer";
import { useSession, signOut } from "next-auth/react";
import { wsService } from "@/lib/websocket-service";

interface Room {
  id: string;
  name?: string;
  title?: string;
  emoji?: string;
  description?: string;
  type: "system" | "custom";
  userCount: number;
  distance: number;
  expiry: string;
  expiresAt?: string;
  activeHours?: { start: number; end: number };
  isActive: boolean;
  createdBy?: string;
  latitude: number;
  longitude: number;
}

// Map system room names to emojis and descriptions
const SYSTEM_ROOM_CONFIG: Record<string, { emoji: string; description: string; activeHours?: { start: number; end: number } }> = {
  "University": { emoji: "🎓", description: "Connect with university students" },
  "College": { emoji: "📚", description: "College community discussions" },
  "School": { emoji: "🏫", description: "School students hangout" },
  "Hospital": { emoji: "🏥", description: "Healthcare community" },
  "Workplace": { emoji: "💼", description: "Professional networking" },
  "Gym": { emoji: "💪", description: "Fitness enthusiasts" },
  "Mall": { emoji: "🛍️", description: "Shopping and lifestyle" },
  "Confession": { emoji: "🤫", description: "Say what you never said out loud" },
  "City": { emoji: "🏙️", description: "Talk about your city" },
  "Hostel": { emoji: "🎓", description: "College chaos & stories" },
  "Exam": { emoji: "📚", description: "Exam anxiety & reactions" },
  "Late Night": { emoji: "🌙", description: "Deep talks after 11 PM", activeHours: { start: 23, end: 2 } },
  "Morning": { emoji: "☀️", description: "Morning vibes 6-9 AM", activeHours: { start: 6, end: 9 } },
  "Sports": { emoji: "🏏", description: "Live sports reactions" },
};

export default function RoomsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // API state
  const [systemRooms, setSystemRooms] = useState<Room[]>([]);
  const [customRooms, setCustomRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION);
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [availableSlots, setAvailableSlots] = useState(5);
  const [usedSlots, setUsedSlots] = useState(0);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
  const [userData, setUserData] = useState<{ userId: string; username: string } | null>(null);

  useEffect(() => {
    // Initialize user
    const user = initializeUser();
    setUserData(user);
    
    // Get user location and load rooms
    loadUserLocationAndRooms();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Set up WebSocket listener for real-time room updates
  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") {
      return;
    }

    const token = (session as any)?.backendToken;
    if (!token) {
      return;
    }

    // Connect to WebSocket
    wsService.connect(token);

    // Listen for new room creation
    wsService.onNewRoomCreated((newRoom) => {
      console.log('🆕 New room created:', newRoom);
      
      // Check if the new room is within 5km of user's location
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        newRoom.latitude,
        newRoom.longitude
      );

      if (distance <= 5) {
        // Add the room to the list
        const formattedRoom: Room = {
          id: newRoom.id,
          title: newRoom.title,
          name: newRoom.title,
          type: 'custom',
          userCount: 0,
          distance: distance,
          expiry: new Date(newRoom.expiresAt).toISOString(),
          expiresAt: newRoom.expiresAt,
          isActive: true,
          createdBy: newRoom.createdBy,
          latitude: newRoom.latitude,
          longitude: newRoom.longitude,
        };

        setCustomRooms((prev) => {
          // Check if room already exists
          if (prev.some(r => r.id === newRoom.id)) {
            return prev;
          }
          // Add to the beginning of the list
          return [formattedRoom, ...prev];
        });

        // Update available slots
        setAvailableSlots((prev) => Math.max(0, prev - 1));
        setUsedSlots((prev) => Math.min(5, prev + 1));

        // Show toast notification
        toast.info("New Room Available", {
          description: `"${newRoom.title}" just opened nearby`,
          duration: 3000,
        });
      }
    });

    return () => {
      // Don't disconnect, just remove this specific listener
      // The socket may be used by other components
    };
  }, [status, session, userLocation]);

  const loadUserLocationAndRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get user's actual location
      const location = await getUserLocation();
      const coords = location || DEFAULT_LOCATION;
      setUserLocation(coords);
      
      // Load all data in parallel
      await Promise.all([
        loadSystemRooms(coords.lat, coords.lng),
        loadCustomRooms(coords.lat, coords.lng),
        loadActiveCount(coords.lat, coords.lng),
        loadAvailableSlots(coords.lat, coords.lng),
      ]);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
      toast.error('Failed to load rooms', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemRooms = async (lat: number, lng: number) => {
    try {
      const rooms = await roomsApi.discoverRooms(lat, lng);
      const mappedRooms: Room[] = rooms.map(room => {
        const config = SYSTEM_ROOM_CONFIG[room.name || ''] || { emoji: '🏠', description: 'Chat room' };
        
        // Build activeHours from API response
        let activeHours = config.activeHours;
        if (room.isTimeSensitive && room.activeHourStart !== undefined && room.activeHourEnd !== undefined) {
          activeHours = { start: room.activeHourStart, end: room.activeHourEnd };
        }
        
        return {
          id: room.id,
          name: room.name,
          emoji: config.emoji,
          description: room.prompt || config.description,
          type: 'system' as const,
          userCount: room.activeUserCount,
          distance: room.distance || calculateDistance(lat, lng, room.latitude, room.longitude),
          expiry: '24h',
          activeHours,
          isActive: room.isActive,
          latitude: room.latitude,
          longitude: room.longitude,
        };
      });
      setSystemRooms(mappedRooms);
    } catch (err) {
      console.error('Error loading system rooms:', err);
      throw err;
    }
  };

  const loadCustomRooms = async (lat: number, lng: number) => {
    try {
      console.log('Loading custom rooms for:', { lat, lng });
      const rooms = await roomsApi.getUserRooms(lat, lng);
      console.log('Custom rooms RAW response:', JSON.stringify(rooms, null, 2));
      
      if (!Array.isArray(rooms)) {
        console.error('Invalid rooms response - not an array:', rooms);
        setCustomRooms([]);
        return;
      }
      
      const mappedRooms: Room[] = rooms.map(room => {
        // Handle both snake_case (from DB) and camelCase (from API)
        const mapped = {
          id: room.id,
          title: room.title || room.name,
          name: room.title || room.name,
          emoji: '💬',
          description: room.title || room.name || 'Custom room',
          type: 'custom' as const,
          userCount: room.activeUserCount || room.active_user_count || 0,
          distance: room.distance || 0,
          expiry: '48h',
          expiresAt: room.expiresAt || room.expires_at,
          isActive: (room.isActive !== false && room.is_active !== false),
          createdBy: room.createdBy || room.created_by,
          latitude: room.latitude || 0,
          longitude: room.longitude || 0,
        };
        console.log('Mapped room:', JSON.stringify(mapped, null, 2));
        return mapped;
      });
      
      console.log('✅ Setting custom rooms:', mappedRooms.length, 'rooms');
      setCustomRooms(mappedRooms);
    } catch (err) {
      console.error('❌ Error loading custom rooms:', err);
      setCustomRooms([]);
      // Don't throw - let other data load
    }
  };

  const loadActiveCount = async (lat: number, lng: number) => {
    try {
      const data = await roomsApi.getNearbyActiveCount(lat, lng);
      setTotalActiveUsers(data.totalActiveUsers);
    } catch (err) {
      console.error('Error loading active count:', err);
    }
  };

  const loadAvailableSlots = async (lat: number, lng: number) => {
    try {
      const data = await roomsApi.checkUserRoomSlots(lat, lng);
      setAvailableSlots(data.available);
      setUsedSlots(data.used);
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  const getCurrentHour = () => currentTime.getHours();

  const isRoomActive = (activeHours?: { start: number; end: number }) => {
    if (!activeHours) return true;
    const hour = getCurrentHour();
    if (activeHours.start < activeHours.end) {
      return hour >= activeHours.start && hour < activeHours.end;
    } else {
      return hour >= activeHours.start || hour < activeHours.end;
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomTitle.trim()) {
      toast.error('Please enter a room title');
      return;
    }

    if (!userData) {
      toast.error('User data not initialized');
      return;
    }

    if (availableSlots <= 0) {
      toast.error('Maximum room limit reached', {
        description: 'Only 5 custom rooms allowed per area',
      });
      return;
    }

    try {
      setLoading(true);
      await roomsApi.createUserRoom({
        title: newRoomTitle.trim(),
        lat: userLocation.lat,
        lng: userLocation.lng,
        createdBy: userData.userId,
      });

      toast.success('Room created successfully!', {
        description: `"${newRoomTitle}" is now available`,
      });

      setNewRoomTitle("");
      setIsCreateDialogOpen(false);
      
      // Reload rooms
      await loadCustomRooms(userLocation.lat, userLocation.lng);
      await loadAvailableSlots(userLocation.lat, userLocation.lng);
    } catch (err) {
      console.error('Error creating room:', err);
      toast.error('Failed to create room', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room: Room) => {
    if (!room.isActive) {
      setSelectedRoom(room);
    } else {
      // Navigate to chat room
      const params = new URLSearchParams({
        id: room.id,
        name: room.name || room.title || 'Chat Room',
        type: room.type,
      });
      router.push(`/rooms/chat?${params.toString()}`);
    }
  };

  const getActiveTimeText = (activeHours?: { start: number; end: number }) => {
    if (!activeHours) return "";
    const formatHour = (hour: number) => {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}${period}`;
    };
    return `${formatHour(activeHours.start)} - ${formatHour(activeHours.end)}`;
  };

  if (loading && systemRooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
          <h2 className="text-2xl font-bold">Loading Rooms</h2>
          <p className="text-muted-foreground">Discovering rooms in your area...</p>
        </div>
      </div>
    );
  }

  if (error && systemRooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>Error Loading Rooms</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadUserLocationAndRooms} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                  Radius
                </h1>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.name ? `Welcome, ${session.user.name.split(' ')[0]}!` : 'Discover nearby rooms'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session?.user?.email === 'mshubh612@gmail.com' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin')}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DialogTrigger asChild>
                          <Button 
                            className="shadow-lg" 
                            disabled={availableSlots <= 0}
                            variant={availableSlots <= 0 ? "secondary" : "default"}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Room
                            <Badge variant={availableSlots <= 0 ? "destructive" : "secondary"} className="ml-2">
                              {usedSlots}/5
                            </Badge>
                          </Button>
                        </DialogTrigger>
                      </div>
                    </TooltipTrigger>
                    {availableSlots <= 0 && (
                      <TooltipContent>
                        <p>Maximum 5 custom rooms in this area</p>
                        <p className="text-xs text-muted-foreground">All slots are full (5/5)</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Room</DialogTitle>
                    <DialogDescription>
                      Create your own chat room visible to people nearby.
                      {availableSlots > 0 ? (
                        <span className="text-primary font-semibold"> {availableSlots} of 5 slots available ({usedSlots} used).</span>
                      ) : (
                        <span className="text-destructive font-semibold"> All slots full (5/5).</span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-title">Room Title</Label>
                      <Input
                        id="room-title"
                        placeholder="Enter room title..."
                        value={newRoomTitle}
                        onChange={(e) => setNewRoomTitle(e.target.value)}
                        maxLength={50}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        {newRoomTitle.length}/50 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Room Details</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Room will be visible within 5km radius</p>
                        <p>• Expires in 48 hours or after 24h of inactivity</p>
                        <p>• Anonymous creator name: {userData?.username}</p>
                        <p className={availableSlots <= 0 ? "text-destructive font-semibold" : "text-primary font-semibold"}>
                          • Slots: {usedSlots}/5 used, {availableSlots} available {availableSlots <= 0 && "(FULL)"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={loading}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRoom} disabled={!newRoomTitle.trim() || loading || availableSlots <= 0}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Room'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Sparkles className="w-6 h-6 mx-auto text-primary" />
                <div className="text-2xl font-bold">{systemRooms.length}</div>
                <div className="text-xs text-muted-foreground">System Rooms</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Users className="w-6 h-6 mx-auto text-primary" />
                <div className="text-2xl font-bold">{customRooms.length}</div>
                <div className="text-xs text-muted-foreground">Custom Rooms</div>
              </div>
            </CardContent>
          </Card>
          <Card className={availableSlots <= 0 ? "border-destructive/50" : ""}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="relative">
                  <Plus className={`w-6 h-6 mx-auto ${availableSlots <= 0 ? 'text-destructive' : 'text-primary'}`} />
                  {availableSlots <= 0 && (
                    <Lock className="w-3 h-3 absolute -top-1 -right-2 text-destructive" />
                  )}
                </div>
                <div className={`text-2xl font-bold ${availableSlots <= 0 ? 'text-destructive' : ''}`}>
                  {usedSlots}/5
                </div>
                <div className="text-xs text-muted-foreground">
                  {availableSlots <= 0 ? 'Slots Full' : 'Slots Used'}
                </div>
                {availableSlots > 0 && (
                  <Progress value={(usedSlots / 5) * 100} className="h-1" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Activity className="w-6 h-6 mx-auto text-primary" />
                <div className="text-2xl font-bold">{totalActiveUsers}</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <MapPin className="w-6 h-6 mx-auto text-primary" />
                <div className="text-2xl font-bold">5km</div>
                <div className="text-xs text-muted-foreground">Search Radius</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Rooms Section */}
        <div className="mb-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-3xl font-bold">System Rooms</h2>
            </div>
            <p className="text-muted-foreground">
              Themed rooms automatically available in your area
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRooms.map((room) => (
              <TooltipProvider key={room.id}>
                <Card
                  className={`group transition-all duration-300 ${
                    room.isActive
                      ? "hover:border-primary/50 hover:shadow-lg cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => handleRoomClick(room)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{room.emoji || '🏠'}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {room.name || room.title}
                            {room.isActive && room.activeHours && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                🔴 LIVE
                              </Badge>
                            )}
                            {!room.isActive && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-semibold mb-1">Room Inactive</p>
                                  <p className="text-xs">
                                    Active: {getActiveTimeText(room.activeHours)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {room.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{room.userCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{room.distance}km</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {room.expiry}
                      </Badge>
                    </div>
                    {room.activeHours && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{getActiveTimeText(room.activeHours)}</span>
                      </div>
                    )}
                    {room.isActive && (
                      <Button className="w-full" size="sm">
                        Join Room
                        <MessageCircle className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Custom Rooms Section */}
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-3xl font-bold">Custom Rooms</h2>
                <Badge variant={availableSlots <= 0 ? "destructive" : "secondary"} className="text-sm">
                  {usedSlots}/5 {availableSlots <= 0 && "FULL"}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground">
              Community-created spaces in your area {availableSlots <= 0 && "• All slots occupied"}
            </p>
          </div>

          {/* Full Slots Info Card */}
          {availableSlots <= 0 && (
            <Card className="mb-6 border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-destructive">All Room Slots Occupied (5/5)</p>
                    <p className="text-muted-foreground">
                      Maximum limit of 5 custom rooms reached in your area. Join existing rooms below or wait for rooms to expire.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRooms.length > 0 && console.log('Rendering', customRooms.length, 'custom rooms')}
            {customRooms.map((room) => (
              <Card
                key={room.id}
                className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => handleRoomClick(room)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{room.emoji || '💬'}</div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{room.title || room.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {room.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{room.userCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{room.distance}km</span>
                    </div>
                    {room.expiresAt ? (
                      <CountdownTimer expiresAt={room.expiresAt} showIcon={true} />
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        {room.expiry}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created by <span className="font-medium">{room.createdBy}</span>
                  </div>
                  <Button className="w-full" size="sm">
                    Join Room
                    <MessageCircle className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {customRooms.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Custom Rooms Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a custom room in your area!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Room
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Inactive Room Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Room Currently Inactive
            </DialogTitle>
            <DialogDescription>
              This room is only available during specific hours
            </DialogDescription>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedRoom.emoji}</div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedRoom.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRoom.description}</p>
                </div>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Active Hours:</span>
                    <span>{getActiveTimeText(selectedRoom.activeHours)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Come back during the active hours to join this room
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedRoom(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
