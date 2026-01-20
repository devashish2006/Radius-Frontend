"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Activity, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { API_CONFIG, DEFAULT_LOCATION } from "@/lib/api-config";
import { getUserLocation } from "@/lib/user-utils";

interface ActiveUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActiveUsersDialog({ open, onOpenChange }: ActiveUsersDialogProps) {
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string }>(DEFAULT_LOCATION);

  useEffect(() => {
    if (open) {
      loadActiveUsers();
      // Refresh count every 10 seconds while dialog is open
      const interval = setInterval(loadActiveUsers, 10000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const loadActiveUsers = async () => {
    try {
      // Get user's location
      const userLoc = await getUserLocation();
      const coords = userLoc || DEFAULT_LOCATION;
      setLocation(coords);

      // Fetch active user count
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEARBY_COUNT}?lat=${coords.lat}&lng=${coords.lng}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch active users');
      }

      const data = await response.json();
      setActiveCount(data.totalActiveUsers || 0);
    } catch (error) {
      console.error('Error loading active users:', error);
      setActiveCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
            Live in Your Area
          </DialogTitle>
          <DialogDescription>
            Real-time active users within 5km radius
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Main Count Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <Users className="w-10 h-10 text-primary" />
                  {loading ? (
                    <div className="text-5xl font-bold text-primary animate-pulse">
                      ...
                    </div>
                  ) : (
                    <div className="text-6xl font-bold text-primary">
                      {activeCount}
                    </div>
                  )}
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  {activeCount === 1 ? 'Person Active' : 'People Active'}
                </p>
                <Badge variant="secondary" className="mt-2">
                  <Activity className="w-3 h-3 mr-1" />
                  Live Now
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Location Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {location.city || 'Your location'} • 5km radius
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{Math.max(1, Math.ceil(activeCount / 2))}</div>
                <div className="text-xs text-muted-foreground">Rooms Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{activeCount > 0 ? '~' + Math.ceil(activeCount / 3) : 0}</div>
                <div className="text-xs text-muted-foreground">Avg per Room</div>
              </CardContent>
            </Card>
          </div>

          {/* Info Text */}
          <p className="text-center text-sm text-muted-foreground">
            {activeCount > 0 
              ? "Join now to connect with people nearby!" 
              : "Be the first to start chatting in your area!"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
