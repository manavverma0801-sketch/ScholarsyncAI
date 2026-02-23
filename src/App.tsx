/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, GraduationCap, Sparkles, BookOpen, Clock } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `You are ScholarSync AI, a helpful academic assistant for college students. 
Your goal is to answer questions clearly and in simple language. 
When explaining complex topics, use analogies and break them down into digestible parts. 
Always maintain a supportive, encouraging, and professional academic tone. 
If a student asks for help with an assignment, guide them through the process rather than just giving the final answer. 
Format your responses using Markdown for better readability (use bolding, lists, and headers where appropriate).`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm ScholarSync AI, your academic assistant. How can I help you with your studies today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      // We send the whole history for context, but since we use chat.sendMessage, 
      // it manages history if we keep the chat object. 
      // For simplicity in this demo, we'll just send the current message.
      // In a real app, you'd maintain the chat session.
      
      const response = await chat.sendMessage({ message: input });
      const modelResponse = response.text || "I'm sorry, I couldn't process that request.";

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: modelResponse,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Explain a concept", icon: "💡" },
    { label: "Summarize notes", icon: "📝" },
    { label: "Study schedule", icon: "📅" },
    { label: "Practice quiz", icon: "❓" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-100 shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">ScholarSync AI</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Academic Assistant
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Resources
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> History
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full bg-white md:my-4 md:rounded-2xl md:shadow-xl md:border md:border-slate-200">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                msg.role === 'user' ? "bg-slate-800" : "bg-indigo-100"
              )}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className={cn(
                "flex flex-col gap-1",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                )}>
                  <div className="prose prose-sm max-w-none prose-slate">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-3 mt-8">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    setInput(action.label);
                  }}
                  className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-4 mr-auto max-w-[85%] animate-pulse">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-1">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form 
            onSubmit={handleSendMessage}
            className="relative flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your courses..."
              className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2.5 rounded-lg transition-all",
                input.trim() && !isLoading 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
            ScholarSync AI can make mistakes. Verify important information.
          </p>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="hidden md:block py-4 text-center">
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
          <span>Privacy Policy</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>Terms of Service</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>Help Center</span>
        </div>
      </footer>
    </div>
  );
}
