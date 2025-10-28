import React, { useState, useRef, useEffect } from 'react';
import { FilterState, ChatMessage } from '../../types';
import { callLLMAPI, LLMProviders } from '../../services/llmService';
import { Send, Sparkles, User, Settings } from 'lucide-react';

interface ChatTabProps {
  filters: FilterState;
}

const ChatTab: React.FC<ChatTabProps> = ({ filters }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI marketing data assistant. I have access to all your marketing performance data for ${filters.brand} in ${filters.country} for ${filters.selectedYear}. 

I can analyze:
- Channel performance and ROI trends
- Budget allocation optimization
- Year-over-year comparisons
- Channel correlations and synergies
- Monthly performance patterns
- Strategic recommendations

What would you like to know about your marketing data?`,
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('custom');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update welcome message when filters change
  useEffect(() => {
    setMessages(prevMessages => [{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI marketing data assistant. I have access to all your marketing performance data for ${filters.brand} in ${filters.country} for ${filters.selectedYear}. 

I can analyze:
- Channel performance and ROI trends across all years
- Budget allocation optimization
- Year-over-year comparisons
- Channel correlations and synergies
- Monthly performance patterns
- Strategic recommendations
- Multi-year trend analysis

The context updates automatically when you change filters or run simulations.

What would you like to know about your marketing data?`,
      timestamp: new Date()
    }]);
  }, [filters]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Check if API is configured
    if (!apiEndpoint) {
      setShowSettings(true);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Call LLM API with real data context
      const response = await callLLMAPI(inputValue, filters, apiEndpoint, apiKey);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API configuration.`,
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Chat with Your Data</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Settings size={16} />
          {apiEndpoint ? 'Configured' : 'Setup API'}
        </button>
      </div>

      {/* API Configuration Panel */}
      {showSettings && (
        <div className="card bg-slate-50 border border-slate-200">
          <h3 className="text-lg font-medium mb-4">Configure LLM API</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="input w-full"
              >
                <option value="custom">Custom Endpoint</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">API Endpoint</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://your-api-endpoint.com/chat"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">API Key (optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your API key"
                className="input w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-primary"
              >
                Save Configuration
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-[calc(100vh-240px)] bg-white rounded-lg shadow-card overflow-hidden border border-slate-200">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${message.role === 'user' ? 'bg-primary-100' : 'bg-secondary-100'
                  }`}>
                  {message.role === 'user' ? (
                    <User size={16} className="text-primary-600" />
                  ) : (
                    <Sparkles size={16} className="text-secondary-600" />
                  )}
                </div>

                <div
                  className={`p-3 rounded-lg ${message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                    }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-200' : 'text-slate-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3 max-w-3xl">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-secondary-100">
                  <Sparkles size={16} className="text-secondary-600" />
                </div>

                <div className="p-3 rounded-lg bg-slate-100 text-slate-800">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3 items-end">
            <textarea
              className="flex-1 resize-none input min-h-[44px] py-2 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500"
              placeholder="Ask a question about your marketing data..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ height: 'auto', maxHeight: '120px' }}
            />
            <button
              className={`btn-primary p-3 rounded-full flex-shrink-0 ${!inputValue.trim() || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Powered by AI analytics. Results are based on your marketing data.
          </p>
        </div>
      </div>

      <div className="card bg-slate-50 border border-slate-200">
        <h3 className="text-lg font-medium mb-3">Example Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => setInputValue("Analyze our channel performance and identify the top 3 most efficient channels")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            Analyze our channel performance and identify the top 3 most efficient channels
          </button>
          <button
            onClick={() => setInputValue("What are the key trends in our monthly performance?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            What are the key trends in our monthly performance?
          </button>
          <button
            onClick={() => setInputValue("How do our channels correlate with each other?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            How do our channels correlate with each other?
          </button>
          <button
            onClick={() => setInputValue("Provide strategic recommendations for budget optimization")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            Provide strategic recommendations for budget optimization
          </button>
          <button
            onClick={() => setInputValue("Compare our performance year-over-year and identify growth opportunities")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            Compare our performance year-over-year and identify growth opportunities
          </button>
          <button
            onClick={() => setInputValue("What are the risk factors in our current media mix?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            What are the risk factors in our current media mix?
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;