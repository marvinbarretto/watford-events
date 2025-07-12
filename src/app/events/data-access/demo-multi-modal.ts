/**
 * Demo script showing how to use the new Multi-Modal Event Parser
 * This file demonstrates the capabilities and usage patterns
 */

import { MultiModalParserService } from './multi-modal-parser.service';
import { DataSourceInput } from './data-source-processor.interface';

export class MultiModalParserDemo {
  
  static async runDemo(parserService: MultiModalParserService) {
    console.log('🚀 Multi-Modal Event Parser Demo');
    console.log('=====================================\n');
    
    // Demo 1: Single Text Source
    await this.demoTextParsing(parserService);
    
    // Demo 2: Multiple Sources with Fusion
    await this.demoMultiSourceFusion(parserService);
    
    // Demo 3: Batch Processing
    await this.demoBatchProcessing(parserService);
    
    console.log('✅ Demo completed!');
  }
  
  private static async demoTextParsing(parser: MultiModalParserService) {
    console.log('📝 Demo 1: Single Text Source Parsing');
    console.log('--------------------------------------');
    
    const sampleText = `
WATFORD MUSIC FESTIVAL 2025
Join us for an incredible night of live music!

Date: Saturday 20th July 2025, 7:30 PM
Location: Watford Town Hall
Tickets: £15 advance, £20 on door

Featuring local bands and acoustic performances
Contact: music@watford.com | 01923 123456
Website: www.watfordmusic.com

#WatfordMusic #LiveMusic #Festival
    `.trim();
    
    try {
      const result = await parser.parseFromSingleSource({
        type: 'text',
        data: sampleText,
        priority: 50
      });
      
      if (result.success) {
        console.log('✅ Parsing successful!');
        console.log(`📊 Overall Confidence: ${result.finalData?.overallConfidence}%`);
        console.log(`🎵 Title: ${result.finalData?.title?.value}`);
        console.log(`📅 Date: ${result.finalData?.date?.value}`);
        console.log(`📍 Location: ${result.finalData?.location?.value}`);
        console.log(`🎫 Tickets: ${result.finalData?.ticketInfo?.value}`);
        console.log(`🏷️ Categories: ${result.finalData?.categories?.join(', ')}`);
        console.log(`#️⃣ Tags: ${result.finalData?.tags?.join(', ')}\n`);
      } else {
        console.log('❌ Parsing failed:', result.error);
      }
    } catch (error) {
      console.log('💥 Error:', error);
    }
  }
  
  private static async demoMultiSourceFusion(parser: MultiModalParserService) {
    console.log('🔀 Demo 2: Multi-Source Data Fusion');
    console.log('-----------------------------------');
    
    // Simulate conflicting data from different sources
    const sources: DataSourceInput[] = [
      {
        type: 'text',
        data: `
Summer Concert Series
Saturday July 20th 2025 at 8 PM
Watford Community Center
£12 advance tickets
        `.trim(),
        priority: 50
      },
      {
        type: 'url', // This would normally fetch from a website
        data: 'https://example.com/watford-concert',
        priority: 70,
        options: {
          // Simulate already fetched data for demo
          simulatedData: {
            title: 'Watford Summer Concert Series 2025',
            date: 'July 20th 2025, 7:30 PM', // Conflicting time
            location: 'Watford Town Hall', // Conflicting venue
            ticketInfo: '£15 advance, £18 door', // Conflicting price
            organizer: 'Watford Music Society'
          }
        }
      }
    ];
    
    try {
      console.log('🔄 Processing multiple sources with conflicts...');
      
      const result = await parser.parseFromMultipleSources(sources, {
        fusionConfig: {
          defaultStrategy: 'highest_confidence',
          confidenceThreshold: 30,
          enableSmartMerging: true
        }
      });
      
      if (result.success && result.fusionResult) {
        console.log('✅ Fusion successful!');
        console.log(`📊 Fused Confidence: ${result.fusionResult.confidence.overall}%`);
        console.log(`🤝 Source Agreement: ${result.fusionResult.confidence.sourceAgreement}%`);
        console.log(`📋 Data Completeness: ${result.fusionResult.confidence.dataCompleteness}%`);
        
        if (result.fusionResult.conflicts.length > 0) {
          console.log(`⚠️ Resolved ${result.fusionResult.conflicts.length} conflicts:`);
          result.fusionResult.conflicts.forEach(conflict => {
            console.log(`   - ${conflict.field}: used ${conflict.strategy} strategy`);
          });
        }
        
        if (result.fusionResult.recommendations.length > 0) {
          console.log('💡 Recommendations:');
          result.fusionResult.recommendations.forEach(rec => {
            console.log(`   - ${rec}`);
          });
        }
        
        console.log('\n📄 Final Fused Data:');
        console.log(`🎵 Title: ${result.finalData?.title?.value}`);
        console.log(`📅 Date: ${result.finalData?.date?.value}`);
        console.log(`📍 Location: ${result.finalData?.location?.value}`);
        console.log(`🎫 Tickets: ${result.finalData?.ticketInfo?.value}\n`);
      }
    } catch (error) {
      console.log('💥 Error:', error);
    }
  }
  
  private static async demoBatchProcessing(parser: MultiModalParserService) {
    console.log('📦 Demo 3: Batch Processing Multiple Events');
    console.log('-------------------------------------------');
    
    const eventTexts = [
      'Jazz Night - Friday 15th March 2025, 9 PM at The Swan Pub, £8 entry',
      'Comedy Show - Saturday 16th March 2025, 8 PM at Palace Theatre, £12-£15',
      'Art Exhibition Opening - Sunday 17th March 2025, 2 PM at Watford Museum, Free entry'
    ];
    
    try {
      const batchInputs = eventTexts.map(text => ({
        data: text,
        type: 'text'
      }));
      
      console.log(`🔄 Processing ${batchInputs.length} events in batch...`);
      
      const results = await parser.batchParse(batchInputs);
      
      console.log(`✅ Batch processing completed!`);
      console.log(`📊 Success rate: ${results.filter(r => r.success).length}/${results.length}`);
      
      results.forEach((result, index) => {
        if (result.success) {
          console.log(`\n📋 Event ${index + 1}:`);
          console.log(`   🎵 ${result.finalData?.title?.value}`);
          console.log(`   📅 ${result.finalData?.date?.value}`);
          console.log(`   📍 ${result.finalData?.location?.value}`);
          console.log(`   💰 ${result.finalData?.ticketInfo?.value || 'No ticket info'}`);
        } else {
          console.log(`\n❌ Event ${index + 1} failed: ${result.error}`);
        }
      });
      
      console.log('');
    } catch (error) {
      console.log('💥 Error:', error);
    }
  }
  
  static showCapabilities() {
    console.log('🎯 Multi-Modal Event Parser Capabilities');
    console.log('=========================================\n');
    
    console.log('📊 Data Sources Supported:');
    console.log('  📝 Text Input - Rule-based parsing with regex patterns');
    console.log('  🖼️ Images - AI-powered extraction via Google Gemini');
    console.log('  🌐 Web URLs - Scraping with structured data detection');
    console.log('  📧 Email - Email content parsing (extensible)');
    console.log('  📅 Calendar - ICS/calendar file parsing (extensible)\n');
    
    console.log('🔀 Data Fusion Strategies:');
    console.log('  🎯 Highest Confidence - Use field with best confidence score');
    console.log('  📊 Source Priority - Prefer data from higher-priority sources');
    console.log('  🤝 Consensus - Use values that appear in multiple sources');
    console.log('  🔍 Manual Review - Flag conflicts for human decision\n');
    
    console.log('⚡ Advanced Features:');
    console.log('  🚀 Parallel Processing - Process multiple sources simultaneously');
    console.log('  📦 Batch Processing - Handle multiple events at once');
    console.log('  🎛️ Confidence Tracking - Detailed confidence metrics for each field');
    console.log('  ⚠️ Conflict Resolution - Intelligent handling of conflicting data');
    console.log('  💡 Smart Recommendations - Actionable suggestions for data quality');
    console.log('  🔄 Progressive Enhancement - Real-time feedback during processing\n');
    
    console.log('🎨 User Experience:');
    console.log('  🖱️ Drag & Drop - Easy file uploads for images');
    console.log('  📱 Mobile Ready - Touch-friendly interface');
    console.log('  ⚡ Real-time Preview - See extraction results as they happen');
    console.log('  🎯 Smart Validation - Automatic data quality checks');
    console.log('  📋 JSON Editing - Direct inline editing of extracted data\n');
  }
}

// Usage example:
/*
// In a component or service:
const demo = new MultiModalParserDemo();

// Show what the system can do
MultiModalParserDemo.showCapabilities();

// Run interactive demo
await MultiModalParserDemo.runDemo(this.multiModalParser);
*/