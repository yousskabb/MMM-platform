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
}

// Store conversation state in sessionStorage for session-only persistence
const CONVERSATION_STORAGE_KEY = 'llm_conversation_state';
const SESSION_TIMEOUT_KEY = 'llm_session_timeout';
const SESSION_TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Load conversation state from sessionStorage with timeout check
function loadConversationState(): ConversationState {
  try {
    const stored = sessionStorage.getItem(CONVERSATION_STORAGE_KEY);
    const timeoutStored = sessionStorage.getItem(SESSION_TIMEOUT_KEY);
    
    if (stored && timeoutStored) {
      const lastActivity = parseInt(timeoutStored);
      const now = Date.now();
      
      // Check if session has expired (30 minutes)
      if (now - lastActivity > SESSION_TIMEOUT_DURATION) {
        console.log('LLM session expired after 30 minutes of inactivity');
        clearConversation();
        return {
          messages: [],
          contextSent: false
        };
      }
      
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load conversation state:', error);
  }
  return {
    messages: [],
    contextSent: false
  };
}

// Save conversation state to sessionStorage with timeout update
function saveConversationState(state: ConversationState): void {
  try {
    sessionStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(state));
    sessionStorage.setItem(SESSION_TIMEOUT_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save conversation state:', error);
  }
}

let conversationState: ConversationState = loadConversationState();

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
      contextSent: true
    };
    
    // Save to localStorage
    saveConversationState(conversationState);

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
    
    // Save user message to localStorage
    saveConversationState(conversationState);

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
    
    // Save updated conversation to localStorage
    saveConversationState(conversationState);

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
  return !conversationState.contextSent;
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
    contextSent: false
  };
  // Clear from sessionStorage
  sessionStorage.removeItem(CONVERSATION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_TIMEOUT_KEY);
}

/**
 * Auto-initialize conversation on app startup
 */
export async function autoInitializeConversation(filters: FilterState): Promise<void> {
  const apiEndpoint = import.meta.env.VITE_LLM_API_ENDPOINT;
  const apiKey = import.meta.env.VITE_LLM_API_KEY;
  
  if (!apiEndpoint || !apiKey) {
    console.log('LLM API credentials not configured, skipping auto-initialization');
    return;
  }
  
  // Check if context has already been sent in this session
  if (conversationState.contextSent) {
    console.log('LLM context already initialized in this session');
    return;
  }
  
  try {
    console.log('Auto-initializing LLM conversation on app startup...');
    await initializeConversation(filters);
    console.log('LLM conversation auto-initialized successfully');
  } catch (error) {
    console.error('Failed to auto-initialize LLM conversation:', error);
  }
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

Monthly Performance by Channel:
${Object.entries(yearData.monthlyPerformance || {}).map(([channel, months]: [string, any]) => {
  const monthData = Object.entries(months)
    .map(([month, data]: [string, any]) => `${month}: ${formatCurrency(data.investment)} inv, ${formatCurrency(data.contribution)} contr, ${formatROI(data.roi)} ROI`)
    .join(' | ');
  return `  - ${channel}: ${monthData}`;
}).join('\n')}
`).join('')}

Remember this data for the entire conversation. Answer questions based on this marketing performance data.`;
}
