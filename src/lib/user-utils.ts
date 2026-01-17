/**
 * Generate a unique anonymous user ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate an anonymous username
 */
export function generateAnonymousUsername(): string {
  const adjectives = [
    'Silent', 'Swift', 'Brave', 'Calm', 'Bright', 'Bold', 'Quick', 'Zen',
    'Cool', 'Smart', 'Wild', 'Free', 'True', 'Pure', 'Wise', 'Kind'
  ];
  
  const nouns = [
    'Tiger', 'Eagle', 'Wolf', 'Fox', 'Lion', 'Bear', 'Hawk', 'Owl',
    'Phoenix', 'Dragon', 'Panda', 'Koala', 'Raven', 'Falcon', 'Lynx', 'Jaguar'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999);
  
  return `${adjective}${noun}${number}`;
}

/**
 * Get user's current location
 */
export async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Error getting location:', error);
        resolve(null);
      }
    );
  });
}

/**
 * Calculate distance between two coordinates (in km)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Store user data in localStorage
 */
export function storeUserData(userId: string, username: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('radius_user_id', userId);
    localStorage.setItem('radius_username', username);
  }
}

/**
 * Get user data from localStorage
 */
export function getUserData(): { userId: string; username: string } | null {
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('radius_user_id');
    const username = localStorage.getItem('radius_username');
    
    if (userId && username) {
      return { userId, username };
    }
  }
  return null;
}

/**
 * Initialize or get user data
 */
export function initializeUser(): { userId: string; username: string } {
  let userData = getUserData();
  
  if (!userData) {
    const userId = generateUserId();
    const username = generateAnonymousUsername();
    storeUserData(userId, username);
    userData = { userId, username };
  }
  
  return userData;
}
