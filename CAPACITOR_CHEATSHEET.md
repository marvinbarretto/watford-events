# Capacitor Development Cheat Sheet

## 📦 Recommended package.json Scripts

```json
{
  "scripts": {
    "start": "ng serve",
    "dev": "ng serve --host=0.0.0.0",
    "build": "ng build",
    
    "cap:install": "npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android",
    "cap:init": "npx cap init",
    "cap:add": "npx cap add ios && npx cap add android",
    
    "cap:build": "ng build && npx cap copy",
    "cap:sync": "ng build && npx cap sync",
    
    "cap:android": "npx cap run android",
    "cap:ios": "npx cap run ios",
    
    "cap:live": "ng serve --host=0.0.0.0 --port=3000",
    "cap:android:live": "npx cap run android --live-reload",
    "cap:ios:live": "npx cap run ios --live-reload",
    
    "cap:open:android": "npx cap open android",
    "cap:open:ios": "npx cap open ios"
  }
}
```

## 🚀 Daily Development Workflows

### **Web Development (Desktop/Browser)**
```bash
npm run dev          # Angular dev server accessible on network
# Visit http://localhost:4200 or http://your-ip:4200
```

### **Mobile Live Development (The Magic ✨)**
```bash
# Terminal 1:
npm run cap:live     # Start Angular dev server on network

# Terminal 2:
npm run cap:android:live   # Deploy to Android with live reload
# OR
npm run cap:ios:live       # Deploy to iOS with live reload
```

### **Standard Mobile Deployment**
```bash
npm run cap:sync           # Build Angular + sync to native projects
npm run cap:android        # Deploy to Android device
npm run cap:ios            # Deploy to iOS device
```

## 🔧 Essential Capacitor Commands

### **Project Setup (One-time)**
```bash
npm run cap:install        # Install Capacitor packages
npm run cap:init          # Initialize Capacitor project
npm run cap:add           # Add iOS and Android platforms
```

### **Development Commands**
```bash
npx cap copy              # Copy web assets to native projects
npx cap sync              # Copy + update native dependencies
npx cap update            # Update Capacitor dependencies

npx cap run android       # Build and deploy to Android
npx cap run ios           # Build and deploy to iOS

npx cap open android      # Open Android Studio
npx cap open ios          # Open Xcode
```

### **Build Commands**
```bash
ng build                  # Build Angular app for production
npx cap copy              # Copy built assets to native projects
npx cap build android     # Build native Android APK
npx cap build ios         # Build native iOS app
```

## 🚨 Troubleshooting Guide

### **Common Issues & Solutions**

#### **"Invalid source release" Java Error**
```bash
# Update gradle wrapper
# Edit android/gradle/wrapper/gradle-wrapper.properties:
distributionUrl=https\://services.gradle.org/distributions/gradle-8.4-all.zip

# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx cap sync android
```

#### **Live Reload "Connection Refused"**
```bash
# 1. Start Angular dev server first:
npm run cap:live

# 2. Then start live reload (new terminal):
npm run cap:android:live

# 3. Ensure phone and computer on same WiFi
```

#### **Android Build Failures**
```bash
# Check Java version
java -version    # Should be Java 17 or 21

# Clean everything
cd android
./gradlew clean
cd ..
npx cap sync android

# Update Android Gradle Plugin in android/build.gradle:
classpath 'com.android.tools.build:gradle:8.2.2'
```

#### **iOS Build Issues**
```bash
# Update Xcode and command line tools
sudo xcode-select --install

# Clean iOS build
npx cap sync ios
npx cap open ios  # Clean in Xcode: Product -> Clean Build Folder
```

#### **Dependency Version Conflicts**
```bash
# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap update

# Sync after updates
npx cap sync
```

### **When Things Break**
```bash
# Nuclear option - rebuild everything:
rm -rf node_modules package-lock.json
rm -rf android ios
npm install
npx cap add android ios
npx cap sync
```

## 📁 Important File Locations

### **Configuration Files**
- `capacitor.config.ts` - Main Capacitor configuration
- `android/variables.gradle` - Android SDK versions
- `android/app/build.gradle` - Android app configuration
- `android/gradle/wrapper/gradle-wrapper.properties` - Gradle version

### **Build Output**
- `dist/your-app-name/browser/` - Angular build output
- `android/app/src/main/assets/public/` - Copied web assets (Android)
- `ios/App/App/public/` - Copied web assets (iOS)

## 🔄 Development Modes

### **Web-Only Development**
```bash
npm run dev
# Fast iteration, browser DevTools, no native features
```

### **Mobile Live Development**
```bash
npm run cap:live     # Terminal 1
npm run cap:android:live  # Terminal 2
# Native features, live reload, real device testing
```

### **Production Mobile Build**
```bash
npm run cap:sync
npm run cap:android
# Full native build, ready for app stores
```

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Web development with network access |
| `npm run cap:live` | Start dev server for mobile live reload |
| `npm run cap:android:live` | Deploy to Android with live reload |
| `npm run cap:sync` | Build + sync to native projects |
| `npm run cap:android` | Deploy to Android device |
| `npx cap open android` | Open Android Studio |
| `npx cap copy` | Copy web assets only |
| `npx cap sync` | Copy + update dependencies |

## 🚀 Pro Tips

1. **Always run `npm run cap:live` first** before live reload commands
2. **Keep both terminals running** during live development
3. **Use `npx cap sync`** after installing new packages
4. **Clean builds** solve 80% of weird issues
5. **Check WiFi connection** if live reload fails
6. **Update regularly** - Capacitor moves fast
