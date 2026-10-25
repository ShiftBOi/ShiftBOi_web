declare module "@google/generative-ai" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(opts: {
      model: string;
      systemInstruction?: string;
      generationConfig?: Record<string, unknown>;
    }): {
      generateContent(input: unknown): Promise<{
        response: { text(): string; usageMetadata?: Record<string, number> };
      }>;
    };
  }
}
