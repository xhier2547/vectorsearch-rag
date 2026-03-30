'use client';

import { useState, useRef, useEffect } from 'react';

// imports สำหรับแสดงผลสูตรคณิตศาสตร์
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // สำคัญมาก: ต้อง import CSS ของ katex

type Message = {
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll ไปยังข้อความล่าสุด
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: data.answer, sources: data.sources },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: '❌ **Error:** Cannot connect to server.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.status}\nFile: ${data.filename}`);
      } else {
        alert(`❌ Upload failed: ${data.detail}`);
      }
    } catch (error) {
      alert('❌ Cannot connect to server.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearMemory = async () => {
    if (!confirm('Are you sure you want to clear chat history?')) return;
    try {
      await fetch('http://localhost:8000/clear_memory', { method: 'POST' });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear memory');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- Sidebar ด้านซ้าย (UPGRADED UI) --- */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-5 shadow-inner">
        <div className="flex items-center gap-3 mb-10 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow">
            <span className="text-xl">🧠</span>
          </div>
          <h1 className="text-xl font-bold text-blue-700">Advanced RAG</h1>
        </div>
        
        <div className="space-y-4 flex-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Tools</p>
          
          <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-xl border border-blue-100 hover:bg-blue-100 transition disabled:opacity-50"
          >
            <span>{isUploading ? '⏳' : '📄'}</span>
            {isUploading ? 'Uploading...' : 'Upload PDF'}
          </button>
          
          <button 
            onClick={handleClearMemory}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white text-slate-600 font-medium rounded-xl border border-slate-100 hover:bg-slate-50 transition"
          >
            <span>🧹</span>
            Clear Chat
          </button>
        </div>
        
        <div className="mt-auto border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
          Powered by Gemini 2.5 & LlamaIndex
        </div>
      </aside>

      {/* --- พื้นที่แสดงแชท (UPGRADED UI) --- */}
      <main className="flex-1 flex flex-col bg-slate-50">
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center mt-32 max-w-xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto border border-slate-100 text-5xl">👋</div>
              <h2 className="text-3xl font-extrabold text-slate-800">Welcome to Advanced RAG AI</h2>
              <p className="text-lg text-slate-600">Start a technical discussion by typing your question or uploading a PDF document.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-blue-600'
                }`}>
                  {msg.role === 'user' ? 'ME' : 'AI'}
                </div>
                
                {/* Message Bubble (UPGRADED UI & MATH SUPPORT) */}
                <div className={`max-w-2xl rounded-2xl p-5 shadow-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-800'
                  }`}
                >
                  {/* แสดงผลสูตรคณิตศาสตร์และ Markdown ด้วย ReactMarkdown */}
                  <div className={`markdown-content ${msg.role === 'user' ? 'text-white' : 'text-slate-800'}`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Sources (UPGRADED UI) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">📚 Sources:</p>
                      <div className="space-y-2.5">
                        {msg.sources.map((source, idx) => (
                          <div key={idx} className="bg-slate-50 text-xs text-slate-600 p-3 rounded-lg border border-slate-100 font-mono whitespace-pre-wrap">
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 items-center">
                <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center text-sm text-blue-600 font-bold shadow animate-pulse">AI</div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 text-slate-500 animate-pulse shadow-sm">
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- ช่องพิมพ์ข้อความ (UPGRADED UI) --- */}
        <footer className="bg-white p-6 border-t border-slate-100 shadow-2xl">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-4 bg-slate-50 border border-slate-100 rounded-full p-2 pr-4 shadow-inner focus-within:ring-2 focus-within:ring-blue-300">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your technical question about the PDF..."
              className="flex-1 bg-transparent px-5 py-3 focus:outline-none text-black text-lg"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow"
            >
              <span className="text-xl">✈️</span>
            Send
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}