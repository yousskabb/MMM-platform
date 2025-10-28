import { getLLMContext } from '../data/dataService';
import { FilterState } from '../types';

interface LLMResponse {
  success: boolean;
  answer: string;
  error?: string;
}

interface CachedContext {
  context: any;
  filters: FilterState;
  timestamp: number;
}

// Cache context for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let cachedContext: CachedContext | null = null;

/**
 * Get cached context or fetch new one
 */
function getCachedContext(filters: FilterState): any {
  const now = Date.now();
  
  // Check if we have valid cached context
  if (cachedContext && 
      now - cachedContext.timestamp < CACHE_DURATION &&
      cachedContext.filters.selectedYear === filters.selectedYear) {
    return cachedContext.context;
  }
  
  // Fetch new context
  const context = getLLMContext(filters);
  if (context) {
    cachedContext = {
      context,
      filters: { ...filters },
      timestamp: now
    };
  }
  
  return context;
}

/**
 * Call LLM API with cached context
 */
export async function callLLMAPI(
  question: string,
  filters: FilterState,
  apiEndpoint: string,
  apiKey?: string
): Promise<LLMResponse> {
  try {
    // Get cached context
    const dataContext = getCachedContext(filters);
    
    if (!dataContext) {
      return {
        success: false,
        answer: "Sorry, I don't have access to the data right now.",
        error: "No data context available"
      };
    }

    // Build prompt (much shorter since context is cached)
    const prompt = `Based on the marketing data context I provided earlier, answer this question:

QUESTION: ${question}

Answer concisely and directly. Provide specific numbers when asked.`;

    // Prepare Azure OpenAI request body
    const requestBody = {
      messages: [
        {
          role: "system",
          content: `You are a Marketing Mix Modeling (MMM) analyst. You have been given context about sales, contributions, investments, ROI, channels, and years. Answer questions concisely and directly. Provide specific numbers when asked. Only give detailed analysis if specifically requested.

MMM DATA CONTEXT for ${dataContext.context.brand} in ${dataContext.context.country}:

AVAILABLE YEARS: ${dataContext.context.availableYears.join(', ')}

ALL YEARS DATA:
${dataContext.allYearsData.map((yearData: any) => `
${yearData.year}:
- Total Investment: €${(yearData.totalInvestment / 1000000).toFixed(1)}M
- Total Contribution: €${(yearData.totalContribution / 1000000).toFixed(1)}M
- Total ROI: ${yearData.totalROI.toFixed(2)}x
- Total Sell Out: €${(yearData.totalSellOut / 1000000).toFixed(1)}M
- Channels: ${yearData.channelPerformance.map((ch: any) => `${ch.channel}: €${(ch.investment / 1000000).toFixed(1)}M inv, €${(ch.contribution / 1000000).toFixed(1)}M contr, ${ch.roi.toFixed(2)}x ROI`).join(' | ')}
`).join('')}

AVAILABLE VARIABLES: ${dataContext.variables.join(', ')}

Remember this context for the entire conversation. Answer questions based on this data.`
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

    // Make API call
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'api-version': '2024-02-15-preview'
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
      answer: "I'm sorry, I encountered an error while processing your question.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear context cache
 */
export function clearContextCache(): void {
  cachedContext = null;
}
