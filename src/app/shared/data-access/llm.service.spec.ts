import { TestBed } from '@angular/core/testing';
import { LLMService } from './llm.service';
import { firestoreServiceProviders } from '../../../testing/test-providers';

// Mock GoogleGenerativeAI
const mockGenerativeAI = {
  getGenerativeModel: jest.fn()
};

const mockModel = {
  generateContent: jest.fn()
};

const mockResponse = {
  response: {
    text: jest.fn()
  }
};

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => mockGenerativeAI)
}));

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LLMService,
        ...firestoreServiceProviders
      ]
    });

    service = TestBed.inject(LLMService);

    // Reset mocks
    jest.clearAllMocks();
    mockGenerativeAI.getGenerativeModel.mockReturnValue(mockModel);
    mockModel.generateContent.mockResolvedValue(mockResponse);
    mockResponse.response.text.mockReturnValue('Mock LLM response');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(service.isProcessing()).toBe(false);
    expect(service.requestCount()).toBe(0);
  });

  describe('testConnection', () => {
    it.todo('should test connection successfully');
  });

  // TODO: Add image extraction tests when async testing is properly implemented
  describe('extractEventFromImage', () => {
    it.todo('should extract event data from image');
    it.todo('should handle malformed JSON response from LLM');
    it.todo('should handle LLM API errors');
    it.todo('should handle image optimization errors');
    it.todo('should set processing state during extraction');
    it.todo('should include raw LLM response in result');
  });

  describe('utility methods', () => {
    it('should return stats', () => {
      const stats = service.getStats();

      expect(stats).toEqual({
        requestCount: 0,
        cacheSize: 0,
        isProcessing: false
      });
    });

    it('should clear cache', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.clearCache();

      expect(consoleSpy).toHaveBeenCalledWith('[LLMService] Cache cleared');
      consoleSpy.mockRestore();
    });
  });
});
