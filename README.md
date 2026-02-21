# ChugLi Frontend 💬

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

## 📖 About

ChugLi Frontend is a **modern, location-based anonymous chat application** built with Next.js 16, React 19, and TypeScript. It provides a beautiful, responsive interface for discovering and joining hyper-local chat rooms based on your geographic location.

### Key Features

🎨 **Beautiful UI/UX**
- Modern glassmorphism design with dark mode
- Smooth animations using Framer Motion
- Responsive layout for mobile, tablet, and desktop
- Custom UI components with shadcn/ui
- Real-time updates with optimistic UI

🗺️ **Location Intelligence**
- Automatic location detection with fallback to Delhi
- Distance calculation from user to rooms
- Room proximity filtering (5km radius)
- Interactive room discovery interface
- Geolocation-based room suggestions

💬 **Real-time Chat**
- WebSocket-based instant messaging
- Live typing indicators
- User presence tracking
- Anonymous identity generation
- Message history loading
- Slow mode indicators

🏠 **Room Features**
- System rooms with themed discussions
- User-created custom rooms
- Room sharing via shareable links
- Lobby system (waiting for users)
- Live countdown timers
- Room expiry notifications
- Background music support

🔐 **Authentication & Security**
- Google OAuth integration with NextAuth
- Session management
- Protected routes
- JWT token handling
- Ban check system
- Automatic login redirects

📊 **Admin Dashboard**
- Real-time analytics and metrics
- User management (ban/unban)
- Room statistics and popularity
- Message activity monitoring
- Engagement tracking
- Interactive charts with Recharts

🎯 **User Experience**
- Toast notifications with Sonner
- Loading states and skeletons
- Error handling with user feedback
- Keyboard shortcuts
- Copy-to-clipboard functionality
- Background music player

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin dashboard page
│   │   ├── banned/            # Ban notification page
│   │   ├── rooms/             # Rooms listing & chat
│   │   │   └── chat/          # Chat room page
│   │   ├── api/               # API routes
│   │   │   └── auth/          # NextAuth configuration
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── background-music.tsx
│   │   ├── ban-check-wrapper.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── page-loader.tsx
│   │   └── waiting-for-users.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── use-toast.ts
│   ├── lib/                   # Utility libraries
│   │   ├── api-config.ts      # API configuration
│   │   ├── api-service.ts     # Room API calls
│   │   ├── analytics-service.ts # Analytics API calls
│   │   ├── user-utils.ts      # User utilities
│   │   ├── websocket-service.ts # WebSocket client
│   │   └── utils.ts           # Helper functions
│   └── public/                # Static assets
│       └── TwitterBG.mpeg     # Background music
├── components.json            # shadcn/ui config
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **Animations**: Framer Motion
- **Authentication**: NextAuth.js 4
- **WebSocket**: Socket.IO Client
- **Charts**: Recharts
- **Notifications**: Sonner (toast)
- **Icons**: Lucide React
- **Theme**: next-themes (dark mode)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- Running ChugLi backend server

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/devashish2006/Radius-Frontend.git
cd Radius-Frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Google OAuth (must match backend)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

4. **Generate NextAuth secret**
```bash
openssl rand -base64 32
```

5. **Start the development server**
```bash
npm run dev
```

The app will be running at `http://localhost:3000`

## 🎨 Features Overview

### Landing Page
- Eye-catching hero section with gradient effects
- "Sign in with Google" authentication
- Platform features showcase
- Social media links
- Responsive design

### Rooms Dashboard
- **Discover System Rooms**: Themed rooms with icons and descriptions
- **Create Custom Rooms**: Users can create up to 2 custom rooms per area
- **My Rooms**: View and manage your created rooms
- **Location Display**: Shows current city and location
- **Room Cards**: Display room type, distance, user count, expiry time
- **Quick Actions**: Join room, delete room, share room link

### Chat Room
- **Real-time Messaging**: Instant message delivery
- **Anonymous Identities**: Random names like "Crimson Eagle"
- **User List**: See who's in the room
- **Typing Indicators**: Know when others are typing
- **Message History**: Load past messages
- **Room Info**: Name, user count, expiry time
- **Share Button**: Copy shareable room link
- **Leave Room**: Graceful exit with cleanup
- **Lobby System**: Waiting room when < 2 users

### Admin Panel
Accessible only to admin (`mshubh612@gmail.com`):

**Dashboard Tabs:**
1. **Overview**: Platform statistics, active users, rooms, messages
2. **Users**: User growth trends, active users chart
3. **Rooms**: Room creation trends, type distribution
4. **Messages**: Message volume over time
5. **Engagement**: Retention rates, top contributors
6. **User List**: Paginated user table with ban controls
7. **Banned Users**: List of banned users with unban option
8. **Activity**: Recent messages and online users

**Admin Actions:**
- Ban/unban users with reasons
- View user details and activity
- Monitor platform health
- Track engagement metrics

### Ban System
- **Banned Page**: Shows ban reason and countdown timer
- **24-Hour Auto-Unban**: Temporary bans expire automatically
- **Appeal Process**: Contact support for appeals
- **Real-time Notifications**: WebSocket ban notifications
- **Violation Tracking**: Violation count per user

## 🔌 WebSocket Integration

The app uses Socket.IO for real-time features:

```typescript
// Join room
wsService.joinRoom(roomId, userId, token);

// Send message
wsService.sendMessage(roomId, message, senderName);

// Listen for messages
wsService.on('message', (data) => {
  // Handle new message
});

// Typing indicator
wsService.sendTyping(roomId, senderName, true);

// Leave room
wsService.leaveRoom(roomId, userId);
```

## 📱 Responsive Design

- **Mobile**: Optimized for phones (320px+)
- **Tablet**: Enhanced layout for tablets (768px+)
- **Desktop**: Full-featured desktop experience (1024px+)
- **Touch-friendly**: Large tap targets and gestures
- **Adaptive**: Components adjust to screen size

## 🎭 Components

### UI Components (shadcn/ui)
- Button, Card, Dialog, Badge, Avatar
- Tabs, ScrollArea, Progress, Tooltip
- Label, Separator
- All customized with Tailwind CSS

### Custom Components
- **BackgroundMusic**: Audio player for ambiance
- **BanCheckWrapper**: Ban status verification
- **CountdownTimer**: Live countdown display
- **PageLoader**: Loading state component
- **WaitingForUsers**: Lobby/waiting room

## 🔒 Security & Privacy

- **OAuth Authentication**: Secure Google sign-in
- **JWT Tokens**: Encrypted session management
- **Anonymous Chat**: Real names never exposed
- **Protected Routes**: Authentication required
- **CORS Configuration**: Backend whitelist
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based security

## 🚀 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

### Environment Setup
For production deployment:
- Set `NEXTAUTH_URL` to your production domain
- Use secure `NEXTAUTH_SECRET`
- Configure production Google OAuth credentials
- Update `NEXT_PUBLIC_API_URL` to backend URL
- Enable HTTPS for secure cookies

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.ts` to customize colors:
- Primary colors
- Background colors
- Border colors
- Text colors

### Components
Customize shadcn/ui components in `src/components/ui/`

### Animations
Modify Framer Motion animations in component files

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👥 Author

**Devashish**
- GitHub: [@devashish2006](https://github.com/devashish2006)
- Instagram: [@devashish_6363](https://www.instagram.com/devashish_6363)
- X (Twitter): [@devashish6363](https://x.com/devashish6363)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)
- Real-time by [Socket.IO](https://socket.io/)

---

<p align="center">Made with ❤️ for authentic local conversations</p>
