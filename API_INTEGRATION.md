# Radius Frontend - API Integration

## Backend Connection

The frontend is now fully integrated with the real backend APIs.

### Prerequisites

1. **Backend Server Must Be Running**
   ```bash
   cd radius-backend
   npm run start:dev
   ```
   Backend should be running on `http://localhost:4000`

2. **Environment Variables**
   The `.env.local` file is configured with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_WS_URL=http://localhost:4000
   ```

### Integrated APIs

#### Rooms API (`/lib/api-service.ts`)
- ✅ **Discover System Rooms** - `GET /rooms/discover`
- ✅ **Get Nearby Rooms** - `GET /rooms/nearby`
- ✅ **Get Active User Count** - `GET /rooms/nearby/count`
- ✅ **Get Room Details** - `GET /rooms/:roomId`
- ✅ **Create User Room** - `POST /rooms/user`
- ✅ **Get User Rooms** - `GET /rooms/user`
- ✅ **Check Room Slots** - `GET /rooms/user/slots`

#### Features Implemented

1. **Real-Time Room Discovery**
   - Fetches system rooms from backend based on location
   - Shows actual user counts from database
   - Calculates real distances using coordinates

2. **User Room Creation**
   - Creates rooms via API with validation
   - Shows available slots (max 5 per area)
   - Handles errors gracefully with toast notifications

3. **Location Services**
   - Attempts to get user's actual geolocation
   - Falls back to default location (Delhi) if denied
   - Stores user data in localStorage

4. **Anonymous User System**
   - Generates unique user IDs
   - Creates anonymous usernames (e.g., "SilentTiger42")
   - Persists across sessions

5. **Loading & Error States**
   - Shows loading spinner while fetching data
   - Displays error messages with retry option
   - Toast notifications for all actions

### Testing the Integration

1. **Start Backend**
   ```bash
   cd ../radius-backend
   npm run start:dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**
   - Navigate to http://localhost:3000
   - Click "Get Started" or "Launch App"
   - See loading animation
   - View real rooms from backend
   - Try creating a custom room
   - Check that user counts update

### API Response Handling

- All API calls include error handling
- Loading states prevent multiple submissions
- Toast notifications inform users of success/failure
- Automatic retry for failed requests

### User Data Storage

User data is stored in browser localStorage:
- `radius_user_id`: Unique user identifier
- `radius_username`: Anonymous generated name

### Next Steps for WebSocket

To add real-time chat functionality:
1. Install socket.io-client
2. Create WebSocket service
3. Implement join/leave room events
4. Add message sending/receiving
5. Update user counts in real-time

### Debugging

Check browser console for:
- API request/response logs
- Error messages
- WebSocket connection status

Check backend logs for:
- Incoming requests
- Database queries
- Room creation/updates
