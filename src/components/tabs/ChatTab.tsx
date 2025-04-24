import React, { useState, useRef, useEffect } from 'react';
import { FilterState, ChatMessage } from '../../types';
import { generateChatAnswer } from '../../data/mockData';
import { Send, Sparkles, User } from 'lucide-react';

interface ChatTabProps {
  filters: FilterState;
}

const ChatTab: React.FC<ChatTabProps> = ({ filters }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your marketing data assistant. You can ask me questions about your marketing performance data for ${filters.brand} in ${filters.country}. For example:
      
- Which channel delivers the best ROI?
- What is our total media investment?
- Which media is least efficient?
- What do you recommend for our budget allocation?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
      content: `Hello! I'm your marketing data assistant. You can ask me questions about your marketing performance data for ${filters.brand} in ${filters.country}. For example:
      
- Which channel delivers the best ROI?
- What is our total media investment?
- Which media is least efficient?
- What do you recommend for our budget allocation?`,
      timestamp: new Date()
    }]);
  }, [filters]);
  
  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;
    
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
    
    // Simulate AI processing time
    setTimeout(() => {
      const answer = generateChatAnswer(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsProcessing(false);
    }, 1000);
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
      </div>
      
      <div className="flex flex-col h-[calc(100vh-240px)] bg-white rounded-lg shadow-card overflow-hidden border border-slate-200">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`flex gap-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user' ? 'bg-primary-100' : 'bg-secondary-100'
                }`}>
                  {message.role === 'user' ? (
                    <User size={16} className="text-primary-600" />
                  ) : (
                    <Sparkles size={16} className="text-secondary-600" />
                  )}
                </div>
                
                <div 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-primary-200' : 'text-slate-500'
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
              className={`btn-primary p-3 rounded-full flex-shrink-0 ${
                !inputValue.trim() || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
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
            onClick={() => setInputValue("Which channel delivers the best ROI?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            Which channel delivers the best ROI?
          </button>
          <button
            onClick={() => setInputValue("What is our total media investment?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            What is our total media investment?
          </button>
          <button
            onClick={() => setInputValue("Which media is least efficient?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            Which media is least efficient?
          </button>
          <button
            onClick={() => setInputValue("What do you recommend for our budget allocation?")}
            className="text-left p-2 text-sm rounded hover:bg-slate-100 transition-colors"
          >
            What do you recommend for our budget allocation?
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;