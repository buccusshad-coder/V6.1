# Tracker v7 Mobile App

React Native mobile app for Tracker v7 cryptocurrency portfolio tracking using Expo.

## 📱 Features

- **Authentication** - Login/Register with JWT
- **Wallet Management** - Add/edit/delete wallets across multiple chains
- **Portfolio Tracking** - Real-time portfolio value and PnL
- **Price Monitoring** - Real-time crypto price updates via WebSocket
- **Alerts** - Price and portfolio alerts
- **Analytics** - Performance metrics and distribution charts

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd mobile
npm install
```

### Run on Android
```bash
npm run android
```

### Run on iOS
```bash
npm run ios
```

### Run on Web (Development)
```bash
npm run web
```

## 📁 Project Structure

```
src/
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   └── app/
│       ├── DashboardScreen.tsx
│       ├── WalletsScreen.tsx
│       ├── PositionsScreen.tsx
│       ├── AlertsScreen.tsx
│       ├── PortfolioScreen.tsx
│       └── ProfileScreen.tsx
├── services/
│   └── api.ts
├── store/
│   └── index.ts
├── components/
│   └── (reusable components)
└── App.tsx
```

## 🔧 Configuration

### API URL
Update `src/services/api.ts` with your backend URL:

```typescript
const API_URL = 'YOUR_BACKEND_URL/api';
```

## 🔐 Authentication

The app uses JWT token-based authentication stored in AsyncStorage:
- User logs in → Backend returns JWT token
- Token stored in AsyncStorage
- Token sent in Authorization header for authenticated requests

## 🌐 WebSocket Integration

Real-time price updates via WebSocket:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://backend:3000', {
  namespace: '/prices',
});

socket.emit('subscribe-symbol', 'bitcoin');
socket.on('price-update', (data) => {
  // Handle price update
});
```

## 📦 Dependencies

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and distribution
- **React Navigation** - Navigation library
- **Zustand** - State management
- **Axios** - HTTP client
- **Socket.io-client** - WebSocket client
- **React Hook Form** - Form handling
- **React Native Paper** - UI components

## 🧪 Development Tips

### AsyncStorage
Persistent storage for tokens and user data:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('token', token);
const token = await AsyncStorage.getItem('token');
```

### Navigation
Bottom tab navigation with stack navigation for each tab:
- Auth stack (Login/Register)
- App stack (6 main screens)

### State Management
Global app state with Zustand store:
```typescript
const token = useStore((state) => state.token);
await useStore((state) => state.login)(email, password);
```

## 🚀 Build & Deploy

### EAS Build (Expo Cloud Build)
```bash
eas build --platform all
```

### Android APK
```bash
eas build --platform android --local
```

### iOS IPA
```bash
eas build --platform ios --local
```

## 📝 Roadmap

- [ ] Biometric authentication
- [ ] Offline mode
- [ ] Native notifications
- [ ] Dark theme
- [ ] App store submission

## 🐛 Troubleshooting

### Metro bundler issues
```bash
expo start --clear
```

### Clear dependencies
```bash
rm -rf node_modules
npm install
```

### Permission errors
Check `app.json` for correct permissions in `expo.plugins`

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
