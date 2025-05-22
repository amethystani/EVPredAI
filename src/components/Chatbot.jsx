'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function useResizable(minHeight = 400, maxHeight = 800, minWidth = 300, maxWidth = 600, initialHeight = 500, initialWidth = 350) {
  const [size, setSize] = useState({ height: initialHeight, width: initialWidth });
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newHeight = Math.min(Math.max(window.innerHeight - e.clientY, minHeight), maxHeight);
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setSize({ height: newHeight, width: newWidth });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minHeight, maxHeight, minWidth, maxWidth]);

  const startResizing = () => {
    isResizing.current = true;
  };

  return { size, startResizing };
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { size, startResizing } = useResizable();
  const [genericQuestions, setGenericQuestions] = useState([
    "What are the benefits of electric vehicles?",
    "How long does it take to charge an EV?",
    "What's the average range of an electric car?",
  ]);
  const [currentVideo, setCurrentVideo] = useState('AI.mp4');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

const handleSend = async (message = input) => {
    if (message.trim() === '') return;

    setMessages(prev => [...prev, { role: 'user', content: message, id: Date.now() }]);
    setInput('');
    setIsLoading(true);
    setCurrentVideo('AIL.mp4');

    setGenericQuestions(prev => prev.filter(q => q !== message));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, id: Date.now(), feedback: null }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', id: Date.now(), feedback: null }]);
    } finally {
      setIsLoading(false);
      setCurrentVideo('AI.mp4');
    }
  };

  const handleFeedback = async (messageId, helpful) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: helpful } : msg
    ));

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: messages.find(m => m.id === messageId - 1)?.content,
          response: messages.find(m => m.id === messageId)?.content,
          helpful 
        }),
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
};

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 rounded-full p-4"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </Button>
      )}
      {isOpen && (
        <Card 
          className="fixed bottom-4 right-4 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{ height: `${size.height}px`, width: `${size.width}px` }}
        >
          <div 
            className="flex justify-between items-center p-4 border-b cursor-move bg-primary text-primary-foreground"
            onMouseDown={startResizing}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                <video
                  key={currentVideo}
                  src={currentVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <h2 className="font-semibold">EVAI</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={24} />
            </Button>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        table: ({node, ...props}) => <table className="border-collapse border border-gray-300 mb-2" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                        code: ({node, inline, ...props}) => 
                          inline 
                            ? <code className="bg-gray-100 rounded px-1" {...props} />
                            : <pre className="bg-gray-100 rounded p-2 overflow-x-auto"><code {...props} /></pre>,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
                {message.role === 'assistant' && message.feedback === null && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(message.id, true)}
                      aria-label="Thumbs up"
                    >
                      <ThumbsUp size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(message.id, false)}
                      aria-label="Thumbs down"
                    >
                      <ThumbsDown size={16} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {genericQuestions.length > 0 && (
            <div className="p-2 border-t overflow-x-auto whitespace-nowrap">
              {genericQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="mr-2 mb-2"
                  onClick={() => handleSend(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
          <div className="p-4 border-t flex">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-grow mr-2"
            />
            <Button onClick={() => handleSend()} disabled={isLoading} aria-label="Send message">
              {isLoading ? 'Sending...' : <Send size={18} />}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}