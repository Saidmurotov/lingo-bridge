import axios from 'axios';

export class AIClient {
  private apiKey: string;
  private maxRetries: number;

  constructor(apiKey: string, maxRetries: number = 3) {
    this.apiKey = apiKey;
    this.maxRetries = maxRetries;
  }

  async invokeWithRetry(prompt: string, attempt: number = 1): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-opus-20240229',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`API call failed. Retrying in ${delay}ms... (Attempt ${attempt} of ${this.maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        return this.invokeWithRetry(prompt, attempt + 1);
      }
      throw new Error(`AI API call failed after ${this.maxRetries} attempts: ${error}`);
    }
  }
}
