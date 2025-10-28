import { getLLMContext } from '../data/dataService';
import { FilterState } from '../types';

interface LLMResponse {
    success: boolean;
    answer: string;
    error?: string;
}

interface ConversationState {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    contextSent: boolean;
    lastFilters: FilterState | null;
}

// Store conversation state in memory (you could also use localStorage)
let conversationState: ConversationState = {
    messages: [],
    contextSent: false,
    lastFilters: null
};

/**
 * Initialize conversation with context (call this once when filters change)
 */
export async function initializeConversation(
    filters: FilterState,
    apiEndpoint: string,
    apiKey: string
): Promise<LLMResponse> {
    try {
        const dataContext = getLLMContext(filters);

        if (!dataContext) {
            return {
                success: false,
                answer: "Sorry, I don't have access to the data right now.",
                error: "No data context available"
            };
        }

        const systemMessage = buildSystemMessage(dataContext);

        // Reset conversation with new context
        conversationState = {
            messages: [
                {
                    role: 'system',
                    content: systemMessage
                }
            ],
            contextSent: true,
            lastFilters: filters
        };

        return {
            success: true,
            answer: "Context loaded. You can now ask questions about your marketing data."
        };

    } catch (error) {
        console.error('Conversation initialization error:', error);
        return {
            success: false,
            answer: "Failed to initialize conversation.",
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send a message in the ongoing conversation
 */
export async function sendMessage(
    question: string,
    apiEndpoint: string,
    apiKey: string
): Promise<LLMResponse> {
    try {
        if (!conversationState.contextSent) {
            return {
                success: false,
                answer: "Please initialize the conversation first.",
                error: "No context available"
            };
        }

        // Add user message
        conversationState.messages.push({
            role: 'user',
            content: question
        });

        // Prepare request
        const requestBody = {
            messages: conversationState.messages,
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

        // Extract answer
        let answer = "I couldn't generate a response.";
        if (result.choices && result.choices.length > 0) {
            answer = result.choices[0].message?.content || answer;
        } else if (result.error) {
            throw new Error(`API Error: ${result.error.message || 'Unknown error'}`);
        }

        // Add assistant response to conversation
        conversationState.messages.push({
            role: 'assistant',
            content: answer
        });

        return {
            success: true,
            answer: answer
        };

    } catch (error) {
        console.error('Message sending error:', error);
        return {
            success: false,
            answer: "I'm sorry, I encountered an error while processing your question.",
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if conversation needs to be reinitialized
 */
export function needsReinitialization(filters: FilterState): boolean {
    return !conversationState.contextSent ||
        !conversationState.lastFilters ||
        conversationState.lastFilters.selectedYear !== filters.selectedYear;
}

/**
 * Get current conversation state
 */
export function getConversationState(): ConversationState {
    return conversationState;
}

/**
 * Clear conversation
 */
export function clearConversation(): void {
    conversationState = {
        messages: [],
        contextSent: false,
        lastFilters: null
    };
}

/**
 * Build system message with context
 */
function buildSystemMessage(dataContext: any): string {
  const formatCurrency = (value: number) => `€${(value / 1000000).toFixed(1)}M`;
  const formatROI = (value: number) => `${value.toFixed(2)}x`;
  
  return `You are a Marketing Mix Modeling (MMM) analyst. You have been given marketing performance data for multiple years. Answer questions concisely and directly. Provide specific numbers when asked. Only give detailed analysis if specifically requested.

MARKETING PERFORMANCE DATA:

${dataContext.allYearsData.map((yearData: any) => `
${yearData.year}:
- Total Investment: ${formatCurrency(yearData.totalInvestment)}
- Total Contribution: ${formatCurrency(yearData.totalContribution)}
- Total ROI: ${formatROI(yearData.totalROI)}
- Total Sell Out: ${formatCurrency(yearData.totalSellOut)}
- Channels: ${yearData.channelPerformance.map((ch: any) => `${ch.channel}: ${formatCurrency(ch.investment)} inv, ${formatCurrency(ch.contribution)} contr, ${formatROI(ch.roi)} ROI`).join(' | ')}
`).join('')}

Remember this data for the entire conversation. Answer questions based on this marketing performance data.`;
}
