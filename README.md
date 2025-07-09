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
