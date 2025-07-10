# WatfordEvents

An Angular 20 application for managing Watford events with AI-powered flyer parsing. The application uses Firebase for backend services, server-side rendering (SSR) with Express, and follows Angular's latest best practices with standalone components and signals.

## Key Features

- **AI-Powered Flyer Parser**: Upload event flyers and extract structured event data using Google Gemini LLM
- **Firebase Integration**: Firestore, Auth, and Analytics support
- **Server-Side Rendering**: SSR with Express for better SEO and performance
- **Modern Angular**: Standalone components, signals, and Angular 20 features
- **Mobile-Optimized**: Responsive design with mobile-first approach
- **Multi-Platform**: Progressive Web App with native Android/iOS support via Capacitor

## Tech Stack

### Frontend
- Angular 20 - Framework with signals and standalone components
- Tailwind CSS - Utility-first styling
- TypeScript - Type-safe development

### Backend & Services
- Firebase Auth - User authentication
- Firestore - Real-time database
- Firebase Storage - Image and file storage
- Firebase Hosting - Web app deployment

### Mobile
- Capacitor - Native mobile app framework
- Camera API - Direct photo capture for flyer scanning
- File System API - Local file management

### AI & Processing
- Gemini LLM - Flyer text extraction and parsing
- Custom parsing pipeline - Structure unstructured event data

## Quick Start

### Web Development
```bash
npm install
npm run dev                    # Start with network access
# Visit http://localhost:4200 or http://your-ip:4200
```

### Mobile Development
```bash
# Terminal 1: Start dev server
npm run cap:live

# Terminal 2: Deploy to phone with live reload
npm run cap:android:live
```

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Web development with network access |
| `npm run cap:live` | Start dev server for mobile live reload |
| `npm run cap:android:live` | Deploy to Android with live reload |
| `npm run cap:sync` | Build and sync to native projects |
| `npm run cap:android` | Deploy to Android device |
| `npm run cap:ios` | Deploy to iOS device |

## Project Structure

```
src/
├── app/
│   ├── auth/              # Authentication module
│   ├── events/            # Events feature module with flyer parser
│   ├── shared/            # Shared services, utilities, and components
│   └── users/             # User management module
├── assets/                # Static assets
└── environments/          # Environment configurations

android/                   # Capacitor Android project
ios/                      # Capacitor iOS project
capacitor.config.ts       # Capacitor configuration
```

## Development Workflows

### Web-First Development
**When**: Building web-specific features or general app functionality

```bash
npm start                       # Standard Angular dev server
# Visit http://localhost:4200
```

**Best for**: Business logic, Firebase integration, desktop features, performance optimization

### Mobile Web Testing
**When**: Building mobile features but testing in browser first

```bash
npm run phone                   # Angular dev server accessible on network
# Visit http://localhost:4200 or http://your-ip:4200 on phone browser
```

**Best for**: UI/UX iterations, responsive design testing, form interactions

### Native Mobile Development
**When**: Building mobile-specific features or testing native integrations

```bash
# Terminal 1: Start mobile dev server
npm run cap:live

# Terminal 2: Connect to physical device  
npm run cap:android:live
```

**Best for**: Camera features, native APIs, real device performance, mobile UX

## Deployment

### Web Deployment
```bash
npm run build                  # Build for production
npm run deploy                 # Deploy to Firebase Hosting
```

### Mobile Deployment
```bash
npm run cap:sync               # Build and sync to native projects
npm run cap:android            # Deploy to Android device
npm run cap:ios                # Deploy to iOS device

# Or build for distribution:
npx cap build android         # Build Android APK
npx cap build ios            # Build iOS app
```

## Environment Setup

### Required Environment Variables
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
  },
  gemini: {
    apiKey: "your-gemini-api-key"
  }
};
```

### Mobile Development Prerequisites
- **Android**: Android Studio, Java 17+, Android SDK
- **iOS**: Xcode 14+, iOS 13+ deployment target
- **Both**: Node.js 18+, npm/yarn

## Testing

```bash
npm test                       # Run unit tests with Jest
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Run tests with coverage report
npm run test:ci                # Run tests for CI (headless mode)
```

@angular-builders/jest v20.0.0 internally uses jest-preset-angular and calls the setup functions
Your explicit setup file was creating a duplicate initialization
Modern versions of the Angular Jest builder handle this automatically


## Roadmap

### Current MVP Features ✅
- Basic flyer parser with AI extraction
- Mobile-optimized file upload
- Confidence scoring for extracted data
- Error handling and retry functionality

### Planned Enhancements

#### Phase 1: Enhanced Validation
- [ ] Implement confidence thresholds with auto-retry
- [ ] Add field-specific validation (dates, locations, etc.)
- [ ] Create user feedback system for corrections

#### Phase 2: Advanced AI Features
- [ ] Few-shot prompting with example flyers
- [ ] Chain-of-thought reasoning for complex layouts
- [ ] Multiple model fallback strategies
- [ ] OCR preprocessing for low-quality images

#### Phase 3: Production Optimization
- [ ] Intelligent caching system
- [ ] Batch processing capabilities
- [ ] Cost management and usage monitoring
- [ ] Performance analytics and optimization

#### Phase 4: User Experience
- [ ] Camera integration for direct photo capture
- [ ] Manual correction interface
- [ ] Event data persistence to Firestore
- [ ] Social sharing and event promotion

For detailed optimization strategies, see [Flyer Parser Strategies](docs/flyer-parser-strategies.md).

## Troubleshooting

### Common Issues

#### Live Reload Not Working
```bash
# Kill all processes
pkill -f "ng serve"
pkill -f "capacitor"

# Restart in correct order
npm run cap:live                # Terminal 1 FIRST
npm run cap:android:live        # Terminal 2 SECOND
```

#### Build Issues
```bash
# Clean everything
rm -rf .angular/cache
npx cap clean android
npm run build                   # Test clean build
```

#### Android Build Errors
```bash
# Java version conflicts
java -version                 # Should be 17 or 21

# Gradle issues
cd android
./gradlew --stop              # Kill all Gradle daemons
./gradlew clean               # Clean build
cd ..
npx cap sync android
```

### Working Configuration (July 2025)
- Java 21
- Gradle 8.4
- Android Gradle Plugin 8.2.2
- compileSdk 35

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Angular Team for the amazing framework
- Ionic Team for Capacitor
- Firebase for backend services
- Google AI for Gemini LLM capabilities
