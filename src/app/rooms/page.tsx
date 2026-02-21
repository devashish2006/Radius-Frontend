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
  Bell,
  X,
  Moon,
  Sun,
  Briefcase,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { BanCheckWrapper } from "@/components/ban-check-wrapper";

interface Room {
  id: string;
  name?: string;
  title?: string;
  iconComponent?: any;
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

// Map system room names to icons and descriptions
const SYSTEM_ROOM_CONFIG: Record<string, { icon: any; description: string; activeHours?: { start: number; end: number }; gradient: string }> = {
  "Confession Room": { 
    icon: MessageCircle, 
    description: "Say what you never said out loud", 
    activeHours: { start: 16, end: 21 },
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent"
  },
  "City Talk": { 
    icon: MapPin, 
    description: "Talk about your city", 
    activeHours: { start: 9, end: 16 },
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent"
  },
  "Campus Life": { 
    icon: Users, 
    description: "College chaos & stories",
    gradient: "from-green-500/10 via-green-500/5 to-transparent"
  },
  "Exam Hub": { 
    icon: Clock, 
    description: "Exam anxiety & reactions",
    gradient: "from-orange-500/10 via-orange-500/5 to-transparent"
  },
  "After Hours": { 
    icon: Moon, 
    description: "Deep talks 9 PM-3 AM", 
    activeHours: { start: 21, end: 3 },
    gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent"
  },
  "Morning Pulse": { 
    icon: Sun, 
    description: "Morning vibes 5-9 AM", 
    activeHours: { start: 5, end: 9 },
    gradient: "from-yellow-500/10 via-yellow-500/5 to-transparent"
  },
  "Live Sports Arena": { 
    icon: Activity, 
    description: "Live sports reactions 8 PM-12 AM", 
    activeHours: { start: 20, end: 24 },
    gradient: "from-red-500/10 via-red-500/5 to-transparent"
  },
  "Work & Career": { 
    icon: Briefcase, 
    description: "Office life & career talks 12-5 PM", 
    activeHours: { start: 12, end: 17 },
    gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent"
  },
};

export default function RoomsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoomNotification, setNewRoomNotification] = useState<Room | null>(null);
  
  // API state
  const [systemRooms, setSystemRooms] = useState<Room[]>([]);
  const [customRooms, setCustomRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION);
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [availableSlots, setAvailableSlots] = useState(2);
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
        setUsedSlots((prev) => Math.min(2, prev + 1));

        // Show custom notification popup
        setNewRoomNotification(formattedRoom);
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setNewRoomNotification(null);
        }, 8000);
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
      
      // Get city name via reverse geocoding (with timeout, non-blocking)
      let cityName: string | undefined;
      const getCityName = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
            { 
              signal: controller.signal,
              headers: {
                'User-Agent': 'Redius-App/1.0'
              }
            }
          );
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error('Geocoding failed');
          }
          
          const data = await response.json();
          return data.address?.city || data.address?.town || data.address?.village || data.address?.state;
        } catch (error) {
          console.warn('Failed to get city name, continuing without it:', error);
          return undefined;
        }
      };
      
      // Start geocoding but don't wait for it - load rooms immediately
      const cityNamePromise = getCityName();
      
      // Load all room data in parallel (don't wait for city name)
      await Promise.all([
        loadSystemRooms(coords.lat, coords.lng, undefined), // Load with undefined city first
        loadCustomRooms(coords.lat, coords.lng),
        loadActiveCount(coords.lat, coords.lng),
        loadAvailableSlots(coords.lat, coords.lng),
      ]);
      
      // After rooms are loaded, if we got a city name, reload system rooms with it
      cityName = await cityNamePromise;
      if (cityName) {

        // Silently reload system rooms with city name
        loadSystemRooms(coords.lat, coords.lng, cityName).catch(err => 
          console.warn('Failed to reload rooms with city name:', err)
        );
      }
      
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

  const loadSystemRooms = async (lat: number, lng: number, cityName?: string) => {
    try {
      const rooms = await roomsApi.discoverRooms(lat, lng, cityName);
      const mappedRooms: Room[] = rooms.map(room => {
        // Match room name with config, handling partial matches for city rooms
        let config = SYSTEM_ROOM_CONFIG[room.name || ''];
        
        // If not found, try to match City Talk rooms with dynamic city names
        if (!config && room.name?.startsWith('City Talk:')) {
          config = SYSTEM_ROOM_CONFIG['City Talk'];
        }
        
        // Fallback to default config
        if (!config) {
          config = { icon: MessageCircle, description: 'Chat room', gradient: 'from-gray-500/10 via-gray-500/5 to-transparent' };
        }
        
        // Build activeHours from API response
        let activeHours = config.activeHours;
        if (room.isTimeSensitive && room.activeHourStart !== undefined && room.activeHourEnd !== undefined) {
          activeHours = { start: room.activeHourStart, end: room.activeHourEnd };
        }
        
        // Calculate distance properly
        let distance = 0;
        if (room.distance !== undefined && !isNaN(room.distance)) {
          distance = room.distance;
        } else if (room.latitude && room.longitude) {
          const calcDistance = calculateDistance(lat, lng, room.latitude, room.longitude);
          distance = isNaN(calcDistance) ? 0 : calcDistance;
        }
        
        // Calculate expiry based on activeHours (only show for time-sensitive rooms)
        let expiry = '24h';
        if (activeHours && room.isTimeSensitive) {
          const hours = activeHours.end >= activeHours.start 
            ? activeHours.end - activeHours.start
            : (24 - activeHours.start) + activeHours.end;
          expiry = `${hours}h`;
        }
        
        return {
          id: room.id,
          name: room.name,
          iconComponent: config.icon,
          description: room.prompt || config.description,
          type: 'system' as const,
          userCount: room.activeUserCount,
          distance,
          expiry,
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

      const rooms = await roomsApi.getUserRooms(lat, lng);
      
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
          iconComponent: MessageCircle,
          description: room.title || room.name || 'Custom room',
          type: 'custom' as const,
          userCount: room.activeUserCount || 0,
          distance: room.distance || 0,
          expiry: '48h',
          expiresAt: room.expiresAt,
          isActive: room.isActive !== false,
          createdBy: room.createdBy,
          latitude: room.latitude || 0,
          longitude: room.longitude || 0,
        };
        return mapped;
      });

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
        description: 'Only 2 custom rooms allowed per area',
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
    <BanCheckWrapper>
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* New Room Notification Popup */}
      {newRoomNotification && (
        <div className="fixed top-20 right-4 left-4 md:left-auto z-[60] animate-in slide-in-from-right-5 duration-300">
          <Alert className="max-w-[380px] md:w-[380px] mx-auto md:mx-0 border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/20 p-2 animate-pulse">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <AlertTitle className="text-lg font-bold flex items-center gap-2">
                  New Room Nearby!
                  <Badge variant="secondary" className="text-xs">
                    {newRoomNotification.distance.toFixed(1)}km away
                  </Badge>
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    "{newRoomNotification.title}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created by <span className="font-medium text-primary">{newRoomNotification.createdBy}</span>
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const params = new URLSearchParams({
                          id: newRoomNotification.id,
                          name: newRoomNotification.title || 'Custom Room',
                          type: newRoomNotification.type,
                        });
                        router.push(`/rooms/chat?${params.toString()}`);
                      }}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Join Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewRoomNotification(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text truncate">
                  Redius
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {session?.user?.name ? `Welcome, ${session.user.name.split(' ')[0]}!` : 'Discover nearby rooms'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {session?.user?.email === 'mshubh612@gmail.com' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin')}
                  className="hidden sm:flex border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              {session?.user?.email === 'mshubh612@gmail.com' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push('/admin')}
                  className="sm:hidden h-8 w-8 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                >
                  <Shield className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden sm:flex h-9"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="sm:hidden h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <DialogTrigger asChild>
                          <Button 
                            className="shadow-lg h-8 sm:h-9 text-xs sm:text-sm" 
                            disabled={availableSlots <= 0}
                            variant={availableSlots <= 0 ? "secondary" : "default"}
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden xs:inline">Create</span>
                            <Badge variant={availableSlots <= 0 ? "destructive" : "secondary"} className="ml-1 sm:ml-2 text-[10px] sm:text-xs px-1 sm:px-2">
                              {usedSlots}/2
                            </Badge>
                          </Button>
                        </DialogTrigger>
                      </div>
                    </TooltipTrigger>
                    {availableSlots <= 0 && (
                      <TooltipContent>
                        <p>Maximum 2 custom rooms in this area</p>
                        <p className="text-xs text-muted-foreground">All slots are full (2/2)</p>
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
                        <span className="text-primary font-semibold"> {availableSlots} of 2 slots available ({usedSlots} used).</span>
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
                          • Slots: {usedSlots}/2 used, {availableSlots} available {availableSlots <= 0 && "(FULL)"}
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Card>
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto text-primary" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{systemRooms.length}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">System Rooms</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto text-primary" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{customRooms.length}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Custom Rooms</div>
              </div>
            </CardContent>
          </Card>
          <Card className={availableSlots <= 0 ? "border-destructive/50" : ""}>
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="relative">
                  <Plus className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto ${availableSlots <= 0 ? 'text-destructive' : 'text-primary'}`} />
                  {availableSlots <= 0 && (
                    <Lock className="w-2 h-2 sm:w-3 sm:h-3 absolute -top-1 -right-2 text-destructive" />
                  )}
                </div>
                <div className={`text-lg sm:text-xl md:text-2xl font-bold ${availableSlots <= 0 ? 'text-destructive' : ''}`}>
                  {usedSlots}/2
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {availableSlots <= 0 ? 'Slots Full' : 'Slots Used'}
                </div>
                {availableSlots > 0 && (
                  <Progress value={(usedSlots / 2) * 100} className="h-1" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto text-primary" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold">{totalActiveUsers}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Active Users</div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto text-primary" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold">5km</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Search Radius</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Rooms Section */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">System Rooms</h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Themed rooms automatically available in your area
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemRooms.map((room) => {
              const RoomIcon = room.iconComponent || MessageCircle;
              const config = SYSTEM_ROOM_CONFIG[room.name || ''] || 
                             SYSTEM_ROOM_CONFIG['City Talk'] || 
                             { gradient: 'from-gray-500/10 via-gray-500/5 to-transparent' };
              
              return (
                <TooltipProvider key={room.id}>
                  <Card
                    className={`group relative overflow-hidden transition-all duration-300 border-2 ${
                      room.isActive
                        ? "hover:border-primary/50 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                        : "opacity-60 cursor-not-allowed border-border/50"
                    }`}
                    onClick={() => handleRoomClick(room)}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                          {/* Icon with modern styling */}
                          <div className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl ${
                            room.isActive 
                              ? 'bg-primary/10 text-primary ring-2 ring-primary/20' 
                              : 'bg-muted text-muted-foreground'
                          } transition-all duration-300 group-hover:scale-110`}>
                            <RoomIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2 mb-1">
                              {room.name || room.title}
                              {room.isActive && room.activeHours && (
                                <Badge variant="default" className="text-xs px-2 py-0 bg-green-500/10 text-green-600 border border-green-500/20">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1 animate-pulse" />
                                  LIVE
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
                            <CardDescription className="text-[10px] sm:text-xs line-clamp-2">
                              {room.description}
                            </CardDescription>
                          </div>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 relative z-10">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <div className="p-1 sm:p-1.5 rounded-md bg-primary/10">
                          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">{room.userCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <div className="p-1 sm:p-1.5 rounded-md bg-primary/10">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {room.distance > 0 ? `${room.distance}km` : 'Nearby'}
                        </span>
                      </div>
                      {room.activeHours && (
                        <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                          {room.expiry}
                        </Badge>
                      )}
                    </div>
                    {room.activeHours && (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/50 rounded-lg text-[10px] sm:text-xs">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
                        <span className="font-medium truncate">{getActiveTimeText(room.activeHours)}</span>
                      </div>
                    )}
                    {room.isActive && (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRoomClick(room);
                          }}
                        >
                          Join Room
                          <MessageCircle className="w-4 h-4 ml-2" />
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const roomUrl = `${window.location.origin}/rooms/chat?id=${room.id}&name=${encodeURIComponent(room.name || room.title || 'Chat Room')}&type=system`;
                                  const message = `🎯 Join me on Redius!\n\n📍 Room: ${room.name || room.title}\n💬 ${room.description}\n\n🔗 Click to join: ${roomUrl}`;
                                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                                  window.open(whatsappUrl, '_blank');
                                  toast.success('Opening WhatsApp...');
                                }}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Share via WhatsApp</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipProvider>
            );
            })}
          </div>
        </div>

        {/* Custom Rooms Section */}
        <div>
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Custom Rooms</h2>
                <Badge variant={availableSlots <= 0 ? "destructive" : "secondary"} className="text-xs sm:text-sm">
                  {usedSlots}/2 {availableSlots <= 0 && "FULL"}
                </Badge>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Community-created spaces in your area {availableSlots <= 0 && "• All slots occupied"}
            </p>
          </div>

          {/* Full Slots Info Card */}
          {availableSlots <= 0 && (
            <Card className="mb-4 sm:mb-5 md:mb-6 border-destructive/50 bg-destructive/5">
              <CardContent className="pt-3 sm:pt-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold text-destructive">All Room Slots Occupied (2/2)</p>
                    <p className="text-muted-foreground">
                      Maximum limit of 2 custom rooms reached in your area. Join existing rooms below or wait for rooms to expire.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {customRooms.map((room) => (
              <Card
                key={room.id}
                className="group relative overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer border-2"
                onClick={() => handleRoomClick(room)}
              >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent opacity-50" />
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                      {/* Icon with modern styling */}
                      <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 text-pink-600 ring-2 ring-pink-500/20 transition-all duration-300 group-hover:scale-110">
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg mb-1 truncate">{room.title || room.name}</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                          Created by <span className="font-medium text-primary">{room.createdBy}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                      <div className="p-1 sm:p-1.5 rounded-md bg-primary/10">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{room.userCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                      <div className="p-1 sm:p-1.5 rounded-md bg-primary/10">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-foreground">{room.distance}km</span>
                    </div>
                    {room.expiresAt ? (
                      <CountdownTimer expiresAt={room.expiresAt} showIcon={true} />
                    ) : (
                      <Badge variant="secondary" className="text-xs font-medium">
                        {room.expiry}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created by <span className="font-medium">{room.createdBy}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoomClick(room);
                      }}
                    >
                      Join Room
                      <MessageCircle className="w-4 h-4 ml-2" />
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              const roomUrl = `${window.location.origin}/rooms/chat?id=${room.id}&name=${encodeURIComponent(room.title || room.name || 'Chat Room')}&type=custom`;
                              const message = `🎯 Join me on Redius!\n\n📍 Room: ${room.title || room.name}\n👤 Created by ${room.createdBy}\n💬 Custom room nearby\n\n🔗 Click to join: ${roomUrl}`;
                              const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, '_blank');
                              toast.success('Opening WhatsApp...');
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Share via WhatsApp</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  {selectedRoom.iconComponent && <selectedRoom.iconComponent className="w-8 h-8" />}
                </div>
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
    </BanCheckWrapper>
  );
}
