import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Add JSON middleware for API requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * EthicalScraperService API Endpoints
 */

// In-memory rate limiting (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Rate limiting middleware
const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  console.log(`🚦 [RATE] Request from IP: ${clientIp}`);

  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    console.log(`🚦 [RATE] New window started for ${clientIp} (1/${RATE_LIMIT_MAX_REQUESTS})`);
    next();
  } else if (clientData.count < RATE_LIMIT_MAX_REQUESTS) {
    clientData.count++;
    console.log(`🚦 [RATE] Request allowed for ${clientIp} (${clientData.count}/${RATE_LIMIT_MAX_REQUESTS})`);
    next();
  } else {
    console.log(`🛡️  [ETHICS] Rate limit exceeded for ${clientIp} - blocking request`);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
};

// Import the scraping engine and scheduler
import { EthicalScraper } from './scraping-engine/ethical-scraper';
import { SchedulerService } from './scheduler/scheduler.service';

// Create singleton scraper instance to maintain cache
const scraperInstance = new EthicalScraper();
console.log(`🕷️  [SCRAPER] Singleton EthicalScraper instance created`);

// Create scheduler service
const schedulerService = new SchedulerService();
console.log(`🕰️  [SCHEDULER] Scheduler service created`);

// Scraping endpoint
app.post('/api/scrape', rateLimit, async (req, res): Promise<void> => {
  const startTime = Date.now();
  console.log(`🕷️  [SCRAPER] Starting scrape request at ${new Date().toISOString()}`);

  try {
    const { url, actions = [], extractors = [], options = {} } = req.body;

    if (!url) {
      console.log(`❌ [ERROR] No URL provided in request`);
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      console.log(`❌ [ERROR] Invalid URL format: ${url}`);
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    console.log(`🎯 [SCRAPER] Target URL: ${url}`);
    console.log(`📋 [SCRAPER] Custom actions: ${actions.length}`);
    console.log(`📊 [SCRAPER] Custom extractors: ${extractors.length}`);
    console.log(`⚙️  [SCRAPER] Options: ${JSON.stringify(options)}`);

    // Create scraping request
    const scrapingRequest = {
      url,
      actions: actions.length > 0 ? actions : undefined,
      extractors: extractors.length > 0 ? extractors : undefined,
      options: {
        ...options,
        includeIframes: options.includeIframes !== false,
        screenshot: options.screenshot || false
      },
      useCache: options.useCache !== false,
      cacheTTL: options.cacheTTL || 300 // 5 minutes default
    };

    // Use singleton scraper instance to maintain cache
    const result = await scraperInstance.scrape(scrapingRequest);

    const totalTime = Date.now() - startTime;

    if (result.success) {
      console.log(`✅ [SCRAPER] Scraping completed successfully in ${totalTime}ms`);
      console.log(`📊 [PERF] Total processing time: ${totalTime}ms`);
      console.log(`📊 [PERF] Data extracted: ${Object.keys(result.data).length} fields`);
    } else {
      console.log(`❌ [SCRAPER] Scraping failed in ${totalTime}ms`);
      console.log(`🔍 [ERROR] Errors: ${result.errors?.join(', ')}`);
    }

    res.json(result);

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`💥 [ERROR] Scraping failed after ${totalTime}ms: ${error.message}`);
    console.error(`🔍 [ERROR] Stack trace: ${error.stack}`);

    res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
      processingTime: totalTime,
      success: false
    });
  }
});

// Cache management endpoints
app.get('/api/scrape/cache/stats', (req, res) => {
  console.log(`📊 [CACHE] Cache stats requested`);

  try {
    const stats = scraperInstance.getCacheStats();

    console.log(`📊 [CACHE] Current cache size: ${stats.size} entries`);
    res.json(stats);
  } catch (error: any) {
    console.error(`💥 [CACHE] Error getting cache stats: ${error.message}`);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

app.delete('/api/scrape/cache', (req, res) => {
  console.log(`🗑️  [CACHE] Cache clear requested`);

  try {
    scraperInstance.clearCache();

    console.log(`✅ [CACHE] Cache cleared successfully`);
    res.json({ message: 'Cache cleared successfully' });
  } catch (error: any) {
    console.error(`💥 [CACHE] Error clearing cache: ${error.message}`);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Scheduler endpoints
app.post('/api/scheduler/start', async (req, res) => {
  console.log(`🚀 [SCHEDULER] Start requested`);

  try {
    await schedulerService.start();
    const status = schedulerService.getStatus();

    console.log(`✅ [SCHEDULER] Started successfully`);
    res.json({
      message: 'Scheduler started successfully',
      status
    });
  } catch (error: any) {
    console.error(`💥 [SCHEDULER] Error starting scheduler: ${error.message}`);
    res.status(500).json({ error: 'Failed to start scheduler' });
  }
});

app.post('/api/scheduler/stop', async (req, res) => {
  console.log(`🛑 [SCHEDULER] Stop requested`);

  try {
    await schedulerService.stop();
    const status = schedulerService.getStatus();

    console.log(`✅ [SCHEDULER] Stopped successfully`);
    res.json({
      message: 'Scheduler stopped successfully',
      status
    });
  } catch (error: any) {
    console.error(`💥 [SCHEDULER] Error stopping scheduler: ${error.message}`);
    res.status(500).json({ error: 'Failed to stop scheduler' });
  }
});

app.get('/api/scheduler/status', (req, res) => {
  console.log(`📊 [SCHEDULER] Status requested`);

  try {
    const status = schedulerService.getStatus();

    console.log(`📊 [SCHEDULER] Status: ${status.running ? 'Running' : 'Stopped'}, ${status.activeJobs} active jobs`);
    res.json(status);
  } catch (error: any) {
    console.error(`💥 [SCHEDULER] Error getting status: ${error.message}`);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});


// TODO: Resolve this issue - its stopping launch
// Scraping results endpoints
// app.get('/api/scraping/results', async (req, res) => {
//   console.log(`📄 [RESULTS] List results requested`);

//   try {
//     const { promises: fs } = await import('fs');
//     const { join } = await import('path');

//     const resultsDir = join(process.cwd(), 'scraping-results');

//     // Check if results directory exists
//     try {
//       await fs.access(resultsDir);
//     } catch {
//       console.log(`📄 [RESULTS] No results directory found`);
//       return res.json({ dates: [], totalFiles: 0 });
//     }

//     const dates = await fs.readdir(resultsDir);
//     const results: any[] = [];
//     let totalFiles = 0;

//     // Get files from each date directory
//     for (const date of dates.sort().reverse()) { // Most recent first
//       const dateDir = join(resultsDir, date);
//       try {
//         const files = await fs.readdir(dateDir);
//         const jsonFiles = files.filter(f => f.endsWith('.json'));

//         for (const file of jsonFiles.sort().reverse()) {
//           const filepath = join(dateDir, file);
//           const stats = await fs.stat(filepath);

//           results.push({
//             filename: file,
//             date: date,
//             size: stats.size,
//             created: stats.birthtime.toISOString(),
//             modified: stats.mtime.toISOString()
//           });
//           totalFiles++;
//         }
//       } catch (error: any) {
//         console.error(`💥 [RESULTS] Error reading date ${date}: ${error.message}`);
//       }
//     }

//     console.log(`📄 [RESULTS] Found ${totalFiles} result files across ${dates.length} dates`);
//     res.json({
//       dates: dates.sort().reverse(),
//       files: results.slice(0, 50), // Limit to 50 most recent
//       totalFiles
//     });

//   } catch (error: any) {
//     console.error(`💥 [RESULTS] Error listing results: ${error.message}`);
//     res.status(500).json({ error: 'Failed to list scraping results' });
//   }
// });


// TODO: Resolve this issue - its stopping launch
// app.get('/api/scraping/results/:date/:filename', async (req, res) => {
//   const { date, filename } = req.params;
//   console.log(`📄 [RESULTS] File requested: ${date}/${filename}`);

//   try {
//     const { promises: fs } = await import('fs');
//     const { join } = await import('path');

//     // Validate filename (security)
//     if (!filename.match(/^[a-zA-Z0-9_-]+\.json$/)) {
//       return res.status(400).json({ error: 'Invalid filename format' });
//     }

//     // Validate date format
//     if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
//       return res.status(400).json({ error: 'Invalid date format' });
//     }

//     const filepath = join(process.cwd(), 'scraping-results', date, filename);

//     try {
//       const content = await fs.readFile(filepath, 'utf-8');
//       const data = JSON.parse(content);

//       console.log(`📄 [RESULTS] File served: ${filename} (${Math.round(content.length / 1024)}KB)`);
//       res.json(data);

//     } catch (error: any) {
//       if (error.code === 'ENOENT') {
//         console.log(`❌ [RESULTS] File not found: ${date}/${filename}`);
//         res.status(404).json({ error: 'Result file not found' });
//       } else {
//         throw error;
//       }
//     }

//   } catch (error: any) {
//     console.error(`💥 [RESULTS] Error reading result file: ${error.message}`);
//     res.status(500).json({ error: 'Failed to read result file' });
//   }
// });

// TODO: ASAP: Resolve this issue - its stopping launch
// app.get('/api/scraping/results/latest/:siteId', async (req, res) => {
//   const { siteId } = req.params;
//   console.log(`📄 [RESULTS] Latest result requested for site: ${siteId}`);

//   try {
//     const { promises: fs } = await import('fs');
//     const { join } = await import('path');

//     const resultsDir = join(process.cwd(), 'scraping-results');

//     try {
//       await fs.access(resultsDir);
//     } catch {
//       return res.status(404).json({ error: 'No results found' });
//     }

//     const dates = await fs.readdir(resultsDir);
//     let latestFile = null;
//     let latestDate = '';

//     // Search through dates (newest first)
//     for (const date of dates.sort().reverse()) {
//       const dateDir = join(resultsDir, date);
//       try {
//         const files = await fs.readdir(dateDir);
//         const siteFiles = files.filter(f => f.startsWith(`${siteId}_`) && f.endsWith('.json'));

//         if (siteFiles.length > 0) {
//           latestFile = siteFiles.sort().reverse()[0]; // Most recent file
//           latestDate = date;
//           break;
//         }
//       } catch (error: any) {
//         console.error(`💥 [RESULTS] Error reading date ${date}: ${error.message}`);
//       }
//     }

//     if (!latestFile) {
//       console.log(`❌ [RESULTS] No results found for site: ${siteId}`);
//       return res.status(404).json({ error: `No results found for site: ${siteId}` });
//     }

//     const filepath = join(resultsDir, latestDate, latestFile);
//     const content = await fs.readFile(filepath, 'utf-8');
//     const data = JSON.parse(content);

//     console.log(`📄 [RESULTS] Latest result for ${siteId}: ${latestDate}/${latestFile}`);
//     res.json(data);

//   } catch (error: any) {
//     console.error(`💥 [RESULTS] Error getting latest result: ${error.message}`);
//     res.status(500).json({ error: 'Failed to get latest result' });
//   }
// });

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
