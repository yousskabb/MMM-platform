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
    
    // Make API call
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        prompt,
        context: dataContext,
        question
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      answer: result.answer || result.response || result.message || "I couldn't generate a response."
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
  return `You are a marketing analytics expert analyzing data for ${dataContext.context.brand} in ${dataContext.context.country} for the year ${dataContext.context.year}.

MARKETING DATA CONTEXT:

KPI SUMMARY:
- Total Investment: €${(dataContext.kpis.totalInvestment / 1000000).toFixed(1)}M
- Total Contribution: €${(dataContext.kpis.totalContribution / 1000000).toFixed(1)}M
- Total ROI: ${dataContext.kpis.totalROI.toFixed(2)}x
- Total Sell Out: €${(dataContext.kpis.totalSellOut / 1000000).toFixed(1)}M

CHANNEL PERFORMANCE:
${dataContext.channelPerformance.map((ch: any) => 
  `- ${ch.channel}: €${(ch.investment / 1000000).toFixed(1)}M investment, €${(ch.contribution / 1000000).toFixed(1)}M contribution, ${ch.roi.toFixed(2)}x ROI (${ch.mediaType})`
).join('\n')}

${dataContext.yearOverYear ? `
YEAR-OVER-YEAR COMPARISON (${dataContext.context.previousYear} vs ${dataContext.context.year}):
- Investment: €${(dataContext.yearOverYear.previousYear.totalInvestment / 1000000).toFixed(1)}M → €${(dataContext.yearOverYear.currentYear.totalInvestment / 1000000).toFixed(1)}M
- Contribution: €${(dataContext.yearOverYear.previousYear.totalContribution / 1000000).toFixed(1)}M → €${(dataContext.yearOverYear.currentYear.totalContribution / 1000000).toFixed(1)}M
- ROI: ${dataContext.yearOverYear.previousYear.totalROI.toFixed(2)}x → ${dataContext.yearOverYear.currentYear.totalROI.toFixed(2)}x
` : ''}

${dataContext.correlations ? `
CHANNEL CORRELATIONS (key insights):
${Object.entries(dataContext.correlations)
  .filter(([_, corr]: [string, any]) => Math.abs(corr) > 0.3)
  .map(([pair, corr]: [string, any]) => `- ${pair.replace('_', ' & ')}: ${corr.toFixed(2)} correlation`)
  .join('\n')}
` : ''}

MONTHLY PERFORMANCE (ROI by month):
${Object.entries(dataContext.monthlyPerformance).map(([channel, months]: [string, any]) => {
  const monthData = Object.entries(months)
    .map(([month, data]: [string, any]) => `${month}: ${data.roi.toFixed(2)}x`)
    .join(', ');
  return `- ${channel}: ${monthData}`;
}).join('\n')}

QUESTION: ${question}

Please provide a detailed, data-driven analysis and recommendations based on this marketing performance data. Focus on:
1. Key insights from the data
2. Performance trends and patterns
3. Specific recommendations for optimization
4. Budget allocation suggestions
5. Risk factors or areas of concern

Be specific with numbers and percentages where relevant.`;
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
