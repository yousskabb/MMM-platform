import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FilterState, ChatMessage } from '../../types';
import { initializeConversation, sendMessage, needsReinitialization, clearConversation } from '../../services/conversationLLMService';
import { Send, Sparkles, User, Settings, RotateCcw } from 'lucide-react';

interface ConversationChatTabProps {
  filters: FilterState;
}

const ConversationChatTab: React.FC<ConversationChatTabProps> = ({ filters }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(import.meta.env.VITE_LLM_API_ENDPOINT || '');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_LLM_API_KEY || '');
  const [selectedProvider, setSelectedProvider] = useState('azure');
  const [conversationInitialized, setConversationInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation when filters change
  useEffect(() => {
    if (apiEndpoint && apiKey && needsReinitialization(filters)) {
      initializeConversationAsync();
    }
  }, [filters, apiEndpoint, apiKey]);

  const initializeConversationAsync = async () => {
    if (!apiEndpoint || !apiKey) return;
    
    setIsLoading(true);
    try {
      const response = await initializeConversation(filters, apiEndpoint, apiKey);
      if (response.success) {
        setConversationInitialized(true);
        // Add system message to chat
        setMessages([{
          id: Date.now(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date()
        }]);
      } else {
        setMessages([{
          id: Date.now(),
          role: 'assistant',
          content: `Error: ${response.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!apiEndpoint) {
      setShowSettings(true);
      return;
    }

    if (!conversationInitialized) {
      await initializeConversationAsync();
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(inputValue, apiEndpoint, apiKey);
      
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.success ? response.answer : `Error: ${response.error}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    clearConversation();
    setMessages([]);
    setConversationInitialized(false);
  };

  const exampleQuestions = [
    "What was the total investment in 2024?",
    "Which year had the highest ROI?",
    "Compare investment between 2023 and 2024",
    "What are the top 3 performing channels?",
    "How did performance change over time?"
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-slate-800">AI Marketing Analyst</h2>
          {conversationInitialized && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Context Loaded
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetConversation}
            className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
            Setup API
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="input w-full"
              >
                <option value="azure">Azure OpenAI</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Azure OpenAI Endpoint</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions"
                className="input w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Azure OpenAI API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Azure OpenAI API key"
                className="input w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-primary"
              >
                Save & Close
              </button>
              <button
                onClick={initializeConversationAsync}
                disabled={!apiEndpoint || !apiKey}
                className="btn btn-secondary"
              >
                Initialize Context
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">AI Marketing Analyst Ready</h3>
            <p className="text-slate-500 mb-4">
              I have access to your marketing data for all years. Ask me anything about performance, ROI, investments, or trends.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Try asking:</p>
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(question)}
                  className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-200' : 'text-slate-500'
                }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary-600" />
            </div>
            <div className="bg-slate-100 text-slate-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={conversationInitialized ? "Ask about your marketing data..." : "Click 'Initialize Context' first..."}
            disabled={!conversationInitialized || isLoading}
            className="flex-1 input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !conversationInitialized}
            className="btn btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationChatTab;
