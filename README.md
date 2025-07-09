# WatfordEvents

An Angular 20 application for managing Watford events with AI-powered flyer parsing. The application uses Firebase for backend services, server-side rendering (SSR) with Express, and follows Angular's latest best practices with standalone components and signals.

## Key Features

- **AI-Powered Flyer Parser**: Upload event flyers and extract structured event data using Google Gemini LLM
- **Firebase Integration**: Firestore, Auth, and Analytics support
- **Server-Side Rendering**: SSR with Express for better SEO and performance
- **Modern Angular**: Standalone components, signals, and Angular 20 features
- **Mobile-Optimized**: Responsive design with mobile-first approach

## Project Structure

- `src/app/events/` - Events feature module with flyer parser
- `src/app/shared/` - Shared services, utilities, and components
- `src/app/auth/` - Authentication module
- `docs/` - Project documentation

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

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

### Technical Improvements
- [ ] Comprehensive test coverage
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring
- [ ] Security enhancements

For detailed optimization strategies, see [Flyer Parser Strategies](docs/flyer-parser-strategies.md).

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.



🚀 Quick Start
Web Development
bashnpm install
npm run dev                    # Start with network access
# Visit http://localhost:4200 or http://your-ip:4200
Mobile Development
bash# Terminal 1: Start dev server
npm run cap:live

# Terminal 2: Deploy to phone with live reload
npm run cap:android:live
📱 Platform Support

Web: Progressive Web App with Firebase hosting
Android: Native Android app via Capacitor
iOS: Native iOS app via Capacitor

🏗️ Tech Stack
Frontend

Angular 18+ - Framework with signals and standalone components
Tailwind CSS - Utility-first styling
TypeScript - Type-safe development

Backend & Services

Firebase Auth - User authentication
Firestore - Real-time database
Firebase Storage - Image and file storage
Firebase Hosting - Web app deployment

Mobile

Capacitor - Native mobile app framework
Camera API - Direct photo capture for flyer scanning
File System API - Local file management

AI & Processing

Gemini LLM - Flyer text extraction and parsing
Custom parsing pipeline - Structure unstructured event data

🔧 Development Commands
CommandPurposenpm run devWeb development with network accessnpm run cap:liveStart dev server for mobile live reloadnpm run cap:android:liveDeploy to Android with live reloadnpm run cap:syncBuild and sync to native projectsnpm run cap:androidDeploy to Android devicenpm run cap:iosDeploy to iOS device
📂 Project Structure
src/
├── app/
│   ├── core/              # Singleton services, guards, interceptors
│   ├── shared/            # Reusable components and utilities
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── events/        # Event browsing and management
│   │   └── flyer-parser/  # AI-powered flyer analysis
│   └── data-access/       # Firebase services and data models
├── assets/                # Static assets
└── environments/          # Environment configurations

android/                   # Capacitor Android project
ios/                      # Capacitor iOS project
capacitor.config.ts       # Capacitor configuration
🎯 Core Features
Current

Event Discovery - Browse and search local events
User Authentication - Firebase Auth integration
Responsive Design - Works on all screen sizes

In Development

Flyer Parser - Upload flyer images for AI analysis
Camera Integration - Direct photo capture on mobile
Structured Data Extraction - Title, date, time, location, description
Confidence Scoring - AI confidence ratings for extracted data

Planned

Manual Correction Interface - Edit AI-extracted data
Duplicate Detection - Identify similar events
Event Categorization - Auto-tag by type and location
Public Event Database - Searchable event listings
Analytics Dashboard - Event trends and insights

🚀 Deployment
Web (Firebase Hosting)
bashnpm run build
firebase deploy
Android
bashnpm run cap:sync
npm run cap:android
# Or build APK: npx cap build android
iOS
bashnpm run cap:sync
npm run cap:ios
# Or build for App Store: npx cap build ios
🔑 Environment Setup
Required Environment Variables
typescript// src/environments/environment.ts
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
Mobile Development Prerequisites

Android: Android Studio, Java 17+, Android SDK
iOS: Xcode 14+, iOS 13+ deployment target
Both: Node.js 18+, npm/yarn

🤝 Contributing

Fork the repository
Create a feature branch: git checkout -b feature/amazing-feature
Commit changes: git commit -m 'Add amazing feature'
Push to branch: git push origin feature/amazing-feature
Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

Angular Team for the amazing framework
Ionic Team for Capacitor
Firebase for backend services
Google AI for Gemini LLM capabilities




🚀 Deployment & Build Commands Reference
This section provides a comprehensive guide to all build, deployment, and troubleshooting commands used in this project.
📱 Development Workflows
Web Development
bashnpm run dev                    # Start Angular dev server with network access
npm run build                  # Build Angular app for production
npm run deploy:web             # Build and deploy to Firebase Hosting
Mobile Development
bash# Live Development (Instant Updates)
npm run cap:live               # Terminal 1: Start dev server for mobile
npm run cap:android:live       # Terminal 2: Deploy with live reload

# Standard Deployment
npm run cap:sync               # Build Angular + sync to native projects
npm run cap:android            # Deploy to connected Android device
npm run cap:ios                # Deploy to connected iOS device
Production Deployment
bashnpm run deploy:all             # Deploy to both web and mobile distribution
npm run build:android          # Build Android APK for distribution
npm run deploy:android         # Distribute Android build to testers
🔧 Core Capacitor Commands
Project Management
CommandPurposeWhen to Usenpx cap copyCopy web assets to native projectsAfter ng build, before native buildnpx cap syncCopy web assets + update native dependenciesAfter installing new plugins or major changesnpx cap updateUpdate Capacitor core and pluginsMonthly maintenance, after Capacitor updatesnpx cap clean androidClean native Android cacheWhen experiencing weird build issuesnpx cap clean iosClean native iOS cacheWhen experiencing weird build issues
Platform Management
CommandPurposeWhen to Usenpx cap add androidAdd Android platform to projectOne-time setupnpx cap add iosAdd iOS platform to projectOne-time setupnpx cap open androidOpen Android StudioWhen you need native development toolsnpx cap open iosOpen XcodeWhen you need native development tools
Build & Deploy
CommandPurposeWhen to Usenpx cap run androidBuild and deploy to Android deviceStandard development deploymentnpx cap run iosBuild and deploy to iOS deviceStandard development deploymentnpx cap build androidBuild production Android APK/AABPreparing for app store or distributionnpx cap build iosBuild production iOS appPreparing for app store
🧹 Troubleshooting Commands
When Things Go Wrong
Build Failures
bash# Level 1: Light cleanup
npx cap sync                   # Refresh everything

# Level 2: Clean native caches
npx cap clean android         # Clear Android build cache
npx cap clean ios            # Clear iOS build cache

# Level 3: Clean Gradle (Android)
cd android
./gradlew clean               # Clear all Gradle caches
cd ..

# Level 4: Nuclear option
rm -rf node_modules package-lock.json
rm -rf android ios
npm install
npx cap add android ios
npx cap sync
Live Reload Not Working
bash# Check dev server is running
npm run cap:live              # Should show network URL

# Restart live reload
# Kill both terminals, then:
npm run cap:live              # Terminal 1
npm run cap:android:live      # Terminal 2

# Check network connectivity
ping 192.168.x.x              # Your computer's IP
Android Build Errors
bash# Java version conflicts
java -version                 # Should be 17 or 21

# Gradle daemon issues
cd android
./gradlew --stop              # Kill all Gradle daemons
./gradlew clean               # Clean build
cd ..
npx cap sync android

# Dependency conflicts
cd android
./gradlew build --refresh-dependencies
iOS Build Errors
bash# Xcode issues
sudo xcode-select --install   # Update command line tools

# CocoaPods issues
cd ios
pod deintegrate               # Remove all pods
pod install                   # Reinstall
cd ..
npx cap sync ios
🔄 Gradle Commands (Android)
Basic Gradle Operations
bashcd android

# Clean builds
./gradlew clean               # Delete all build outputs

# Build variants
./gradlew assembleDebug       # Build debug APK
./gradlew assembleRelease     # Build release APK
./gradlew bundleRelease       # Build App Bundle (for Play Store)

# Install to device
./gradlew installDebug        # Install debug build
./gradlew uninstallDebug      # Uninstall debug build

# Advanced
./gradlew build --info        # Verbose build output
./gradlew build --refresh-dependencies  # Force dependency refresh
./gradlew --stop              # Stop Gradle daemon
Dependency Management
bash./gradlew dependencies        # Show all dependencies
./gradlew dependencyInsight --dependency firebase-core  # Debug specific dependency
🌐 Firebase Commands
Web Deployment
bash# Basic deployment
firebase deploy               # Deploy all configured services
firebase deploy --only hosting  # Deploy only web hosting

# Advanced options
firebase deploy --message "Release v1.2.3"  # Add deployment message
firebase hosting:channel:deploy preview      # Deploy to preview channel
App Distribution
bash# Distribute APK to testers
firebase appdistribution:distribute android/app/build/outputs/apk/debug/app-debug.apk \
  --app YOUR_APP_ID \
  --groups "testers" \
  --release-notes "Latest features"

# Manage tester groups
firebase appdistribution:group:create beta-testers
firebase appdistribution:testers:add user@example.com --group beta-testers
🚨 Common Error Patterns & Solutions
"Invalid source release: 21"
bash# Solution: Update Gradle version
# Edit android/gradle/wrapper/gradle-wrapper.properties:
# distributionUrl=https\://services.gradle.org/distributions/gradle-8.4-all.zip

cd android && ./gradlew clean && cd ..
npx cap sync android
"Connection refused" (Live Reload)
bash# Ensure dev server runs first
npm run cap:live              # Must start BEFORE
npm run cap:android:live      # live reload command
"Command failed: gradlew"
bash# Make gradlew executable
chmod +x android/gradlew

# Or use full path
cd android && ./gradlew clean
"SDK location not found"
bash# Set Android SDK path
echo "sdk.dir=/Users/yourusername/Library/Android/sdk" > android/local.properties
"Task :app:checkDebugAarMetadata FAILED"
bash# Update Android Gradle Plugin
# Edit android/build.gradle:
# classpath 'com.android.tools.build:gradle:8.2.2'

# Update compileSdk version
# Edit android/variables.gradle:
# compileSdkVersion = 35
📊 Build Optimization Commands
Performance Monitoring
bash# Gradle build performance
cd android
./gradlew build --profile      # Generate performance report

# Bundle analysis
./gradlew assembleRelease
# Upload APK to: https://developer.android.com/studio/build/apk-analyzer
Cache Management
bash# Clear all caches when builds get weird
rm -rf ~/.gradle/caches        # Gradle global cache
rm -rf android/.gradle         # Project Gradle cache
rm -rf android/app/build       # App build outputs
npm run cap:clean android
🎯 Daily Development Commands
Morning Startup
bashgit pull                      # Get latest code
npm install                   # Install any new dependencies
npm run cap:sync             # Sync to native projects
npm run cap:live             # Start dev server (Terminal 1)
npm run cap:android:live     # Start mobile development (Terminal 2)
Before Committing
bashnpm run build                # Ensure web build works
npm run cap:sync            # Ensure mobile sync works
npm run test                # Run tests (if you have them)
Weekly Maintenance
bashnpm update                   # Update npm dependencies
npx cap update              # Update Capacitor
firebase tools:update       # Update Firebase CLI
🔍 Debugging Commands
Verbose Output
bash# Detailed Capacitor logs
npx cap sync --verbose

# Detailed Gradle logs
cd android && ./gradlew build --info --stacktrace

# Firebase deployment logs
firebase deploy --debug
Device Debugging
bash# Android device logs
adb logcat                   # Real-time Android logs
adb devices                  # List connected devices

# Chrome DevTools for mobile app
# Open chrome://inspect in desktop Chrome while app is running
📚 Command Cheat Sheet
Quick Reference
bash# Development
npm run dev                  # Web development
npm run cap:live            # Mobile dev server
npm run cap:android:live    # Mobile live reload

# Building
npm run build               # Build web app
npm run cap:sync           # Sync to mobile
npm run build:android      # Build Android APK

# Deployment
npm run deploy:web         # Deploy to Firebase Hosting
npm run deploy:android     # Distribute Android app
npm run deploy:all         # Deploy everything

# Troubleshooting
npx cap clean android     # Clean Android cache
cd android && ./gradlew clean  # Deep Android clean
rm -rf node_modules && npm install  # Nuclear option
💡 Pro Tips

Always run npm run cap:sync after installing new packages
Use ./gradlew clean when Android builds get weird
Check WiFi connection if live reload fails
Keep multiple terminals open during mobile development
Version control your capacitor.config.ts but not google-services.json
Use --verbose flags when debugging build issues
Clean caches regularly to avoid mysterious build failures
