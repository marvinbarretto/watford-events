export type LLMRequest = {
  prompt: string;
  image?: string; // base64 data URL
};

export type LLMResponse<T = any> = {
  success: boolean;
  data: T;
  error?: string;
  tokensUsed?: number;
  cached: boolean;
};

export type LLMStreamChunk = {
  text: string;
  isComplete: boolean;
  chunkIndex: number;
};

export type LLMStreamResponse<T = any> = {
  success: boolean;
  stream: AsyncIterable<LLMStreamChunk>;
  error?: string;
  cached: boolean;
};
