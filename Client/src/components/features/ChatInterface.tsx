import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { meetingsAPI } from '../../api/endpoints';

interface Message {
  id: string;
  type: 'question' | 'answer';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  meetingId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ meetingId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'question',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await meetingsAPI.chat(meetingId, { question: input });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'answer',
        text: response.data.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'answer',
        text: 'Sorry, there was an error processing your question.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask me anything about this meeting!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === 'question' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.type === 'question'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.type === 'question'
                      ? 'text-primary-200'
                      : 'text-gray-600'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <Button
            onClick={handleSendMessage}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
