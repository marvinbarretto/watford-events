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
