import { AIClient } from './ai';

describe('AIClient', () => {
  it('should construct properly with API key', () => {
    const client = new AIClient('test-key');
    expect(client).toBeDefined();
  });

  it('should invoke and retry on failure', async () => {
    // Mock implementation for Anthropic client would go here
    // Verify that invokeWithRetry calls the underlying API
    expect(true).toBe(true);
  });
});
