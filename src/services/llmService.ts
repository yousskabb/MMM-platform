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
    const formatCurrency = (value: number) => `€${(value / 1000000).toFixed(1)}M`;
    const formatROI = (value: number) => `${value.toFixed(2)}x`;

    return `You are a marketing analytics expert analyzing data for ${dataContext.context.brand} in ${dataContext.context.country}.

MARKETING DATA CONTEXT:

AVAILABLE YEARS: ${dataContext.context.availableYears.join(', ')}

SELECTED YEAR (${dataContext.context.selectedYear}) KPIs:
- Total Investment: ${formatCurrency(dataContext.selectedYearKPIs.totalInvestment)}
- Total Contribution: ${formatCurrency(dataContext.selectedYearKPIs.totalContribution)}
- Total ROI: ${formatROI(dataContext.selectedYearKPIs.totalROI)}
- Total Sell Out: ${formatCurrency(dataContext.selectedYearKPIs.totalSellOut)}

SELECTED YEAR CHANNEL PERFORMANCE:
${dataContext.selectedYearChannelPerformance.map((ch: any) =>
        `- ${ch.channel}: ${formatCurrency(ch.investment)} investment, ${formatCurrency(ch.contribution)} contribution, ${formatROI(ch.roi)} ROI (${ch.mediaType})`
    ).join('\n')}

ALL YEARS DATA:
${dataContext.allYearsData.map((yearData: any) => `
${yearData.year}:
- Total Investment: ${formatCurrency(yearData.totalInvestment)}
- Total Contribution: ${formatCurrency(yearData.totalContribution)}
- Total ROI: ${formatROI(yearData.totalROI)}
- Channels: ${yearData.channelPerformance.map((ch: any) => `${ch.channel} (${formatROI(ch.roi)})`).join(', ')}
`).join('')}

${dataContext.yearOverYear ? `
YEAR-OVER-YEAR COMPARISON (${dataContext.context.previousYear} vs ${dataContext.context.selectedYear}):
- Investment: ${formatCurrency(dataContext.yearOverYear.previousYear.totalInvestment)} → ${formatCurrency(dataContext.yearOverYear.currentYear.totalInvestment)}
- Contribution: ${formatCurrency(dataContext.yearOverYear.previousYear.totalContribution)} → ${formatCurrency(dataContext.yearOverYear.currentYear.totalContribution)}
- ROI: ${formatROI(dataContext.yearOverYear.previousYear.totalROI)} → ${formatROI(dataContext.yearOverYear.currentYear.totalROI)}
` : ''}

${dataContext.correlations ? `
CHANNEL CORRELATIONS (significant correlations > 0.3):
${Object.entries(dataContext.correlations)
                .filter(([_, corr]: [string, any]) => Math.abs(corr) > 0.3)
                .map(([pair, corr]: [string, any]) => `- ${pair.replace('_', ' & ')}: ${corr.toFixed(2)} correlation`)
                .join('\n')}
` : ''}

SELECTED YEAR MONTHLY PERFORMANCE (ROI by month):
${Object.entries(dataContext.selectedYearMonthlyPerformance).map(([channel, months]: [string, any]) => {
                    const monthData = Object.entries(months)
                        .map(([month, data]: [string, any]) => `${month}: ${formatROI(data.roi)}`)
                        .join(', ');
                    return `- ${channel}: ${monthData}`;
                }).join('\n')}

AVAILABLE VARIABLES: ${dataContext.variables.join(', ')}

QUESTION: ${question}

Please provide a detailed, data-driven analysis and recommendations based on this marketing performance data. Focus on:
1. Key insights from the data
2. Performance trends and patterns across years
3. Specific recommendations for optimization
4. Budget allocation suggestions
5. Risk factors or areas of concern

Use the actual data provided above and be specific with numbers and percentages where relevant.`;
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
