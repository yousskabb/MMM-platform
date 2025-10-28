import { getLLMContext } from '../data/dataService';
import { FilterState } from '../types';

interface LLMResponse {
  success: boolean;
  answer: string;
  error?: string;
}

/**
 * Call LLM API with marketing data context
 */
export async function callLLMAPI(
  question: string,
  filters: FilterState,
  apiEndpoint: string,
  apiKey?: string
): Promise<LLMResponse> {
  try {
    // Get comprehensive data context
    const dataContext = getLLMContext(filters);

    if (!dataContext) {
      return {
        success: false,
        answer: "Sorry, I don't have access to the data right now. Please try again later.",
        error: "No data context available"
      };
    }

    // Prepare the prompt with context
    const prompt = buildPrompt(question, dataContext);

    // Prepare Azure OpenAI request body
    const requestBody = {
      messages: [
        {
          role: "system",
          content: "You are a Marketing Mix Modeling (MMM) analyst. You have been given context about sales, contributions, investments, ROI, channels, and years. Answer questions concisely and directly. Provide specific numbers when asked. Only give detailed analysis if specifically requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    // Make API call with proper Azure OpenAI headers
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'api-version': '2024-02-15-preview' // Azure OpenAI API version
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    // Parse Azure OpenAI response format
    let answer = "I couldn't generate a response.";

    if (result.choices && result.choices.length > 0) {
      answer = result.choices[0].message?.content || answer;
    } else if (result.error) {
      throw new Error(`API Error: ${result.error.message || 'Unknown error'}`);
    }

    return {
      success: true,
      answer: answer
    };

  } catch (error) {
    console.error('LLM API Error:', error);
    return {
      success: false,
      answer: "I'm sorry, I encountered an error while processing your question. Please try again.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Build a comprehensive prompt with marketing data context
 */
function buildPrompt(question: string, dataContext: any): string {
  const formatCurrency = (value: number) => `€${(value / 1000000).toFixed(1)}M`;
  const formatROI = (value: number) => `${value.toFixed(2)}x`;

  return `MMM DATA CONTEXT for ${dataContext.context.brand} in ${dataContext.context.country}:

AVAILABLE YEARS: ${dataContext.context.availableYears.join(', ')}

ALL YEARS DATA:
${dataContext.allYearsData.map((yearData: any) => `
${yearData.year}:
- Total Investment: ${formatCurrency(yearData.totalInvestment)}
- Total Contribution: ${formatCurrency(yearData.totalContribution)}
- Total ROI: ${formatROI(yearData.totalROI)}
- Total Sell Out: ${formatCurrency(yearData.totalSellOut)}
- Channels: ${yearData.channelPerformance.map((ch: any) => `${ch.channel}: ${formatCurrency(ch.investment)} inv, ${formatCurrency(ch.contribution)} contr, ${formatROI(ch.roi)} ROI`).join(' | ')}
`).join('')}

${dataContext.correlations ? `
CHANNEL CORRELATIONS for ${dataContext.correlations.year} (significant > 0.3):
${Object.entries(dataContext.correlations.data)
  .filter(([_, corr]: [string, any]) => Math.abs(corr) > 0.3)
  .map(([pair, corr]: [string, any]) => `- ${pair.replace('_', ' & ')}: ${corr.toFixed(2)}`)
  .join('\n')}
` : ''}

AVAILABLE VARIABLES: ${dataContext.variables.join(', ')}

QUESTION: ${question}

Answer concisely and directly. Provide specific numbers when asked.`;
}

/**
 * Example usage with different LLM providers
 */
export const LLMProviders = {
  // OpenAI
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    buildRequest: (prompt: string, apiKey: string) => ({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a marketing analytics expert.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  },

  // Anthropic Claude
  claude: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-sonnet-20240229',
    buildRequest: (prompt: string, apiKey: string) => ({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  },

  // Custom endpoint
  custom: {
    endpoint: 'YOUR_CUSTOM_ENDPOINT',
    buildRequest: (prompt: string, apiKey?: string) => ({
      prompt,
      apiKey
    })
  }
};
