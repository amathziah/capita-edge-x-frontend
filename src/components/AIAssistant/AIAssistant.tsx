import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, Mic, MicOff, Zap, FileText, TrendingUp, Users, RotateCcw, Copy, Check, ChevronDown, AlertTriangle, CreditCard, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../services/aiService';
import { usePersona } from '../../contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  data?: any;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

const defaultActions = [
  { label: 'Revenue today', icon: TrendingUp, query: 'What is my total revenue?' },
  { label: 'Draft invoice', icon: FileText, query: 'Help me create a new invoice' },
  { label: 'Top customers', icon: Users, query: 'Who are my top customers?' },
  { label: 'Business health', icon: Zap, query: 'Give me a business health summary' },
];

const routeActions: Record<string, typeof defaultActions> = {
  '/invoices': [
    { label: 'Draft invoice', icon: FileText, query: 'Help me create a new invoice' },
    { label: 'Unpaid invoices', icon: AlertTriangle, query: 'Which invoices are currently overdue?' },
    { label: 'Monthly billing', icon: TrendingUp, query: 'Show me my billing trends for this month' },
  ],
  '/payments': [
    { label: 'Recent collections', icon: CreditCard, query: 'List my most recent payments' },
    { label: 'Outstanding revenue', icon: Zap, query: 'How much revenue is outstanding?' },
    { label: 'Top payers', icon: Users, query: 'Who are my most consistent payers?' },
  ],
  '/customers': [
    { label: 'Add client', icon: Users, query: 'Help me add a new customer' },
    { label: 'Customer health', icon: Activity, query: 'Analyze my customer retention' },
  ]
};

const personaActions: Record<string, typeof defaultActions> = {
  'solopreneur': [
    { label: 'Check outstanding', icon: AlertTriangle, query: 'How many invoices are overdue?' },
    { label: 'Expense summary', icon: CreditCard, query: 'Show me my expenses for this month' },
    { label: 'Taxes due', icon: Zap, query: 'Estimate my taxes for this quarter' },
  ],
  'saas': [
    { label: 'Check MRR', icon: TrendingUp, query: 'What is my current Monthly Recurring Revenue?' },
    { label: 'Churn report', icon: Users, query: 'Analyze my customer churn' },
    { label: 'Runway left', icon: Activity, query: 'How many months of cash runway do I have?' },
  ],
  'agency': [
    { label: 'Unbilled hours', icon: Clock, query: 'Show me all unbilled hours' },
    { label: 'Retainer health', icon: Activity, query: 'Are any retainers running low?' },
    { label: 'Project profit', icon: TrendingUp, query: 'Which projects are most profitable?' },
  ],
  'ecommerce': [
    { label: 'Stock risks', icon: AlertTriangle, query: 'Which products are at risk of stockout?' },
    { label: 'Dead stock', icon: Zap, query: 'What is my total liquid capital locked in dead stock?' },
    { label: 'Refund rate', icon: RotateCcw, query: 'What is my current refund rate?' },
  ]
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function AIAssistant() {
  const { businessType } = usePersona();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const getGreeting = () => {
    switch (businessType) {
      case 'solopreneur': return "Hey! I'm **Malika**. I'll keep your personal finances organized and your cash flow clear. What's on your mind?";
      case 'saas': return "Systems Nominal. **Malika** here. I'm tracking your MRR, churn, and subscriptions. Ready for growth metrics?";
      case 'agency': return "Hello! **Malika** here. I'm monitoring your client retainers and billable hours. How can I help you today?";
      case 'ecommerce': return "Inventory secure. **Malika** active. I'm tracking your replenishment risks and store health. What do you need?";
      default: return "Hey! 👋 I'm **Malika**, your financial copilot. I can help you check revenue, find invoices, analyze trends, or create new ones. What would you like to do?";
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: getGreeting(),
      timestamp: new Date(),
    }
  ]);

  // Update greeting if user hasn't started chatting and persona changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{
        id: '1',
        sender: 'bot',
        text: getGreeting(),
        timestamp: new Date(),
      }]);
    }
  }, [businessType]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
    }
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
      status: 'sent'
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
      // Send ALL queries to backend AI — it handles intent detection + data lookup
      let response = await aiService.processQuery(userMsg.text, undefined, businessType || undefined);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        data: response.data,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      if (!isOpen) setUnreadCount(prev => prev + 1);

      // Handle actions returned by backend
      const action = response.action;
      if (action) {
        if (action.type === 'open_invoice_modal' || action.type === 'EXECUTE_ACTION') {
          const initialData = action.data && action.type === 'EXECUTE_ACTION' ? {
            buyer: { name: action.data.customer, phone: '' },
            items: [{ description: action.data.description || 'Service', quantity: 1, price: action.data.amount, unit: 'Qty', discount: 0 }]
          } : (action.initialData || action.data);

          window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail: initialData }));
        } else if (action.type === 'navigate' && action.data?.to) {
          // Navigate to page after a brief delay so user sees the response first
          setTimeout(() => {
            window.location.href = action.data.to;
          }, 1200);
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: "⚠️ Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      sender: 'bot',
      text: "Chat cleared! 🧹 How can I help you?",
      timestamp: new Date(),
    }]);
  };

  const startListening = () => {
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-2xl shadow-xl shadow-teal-500/30 flex items-center justify-center transition-all">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={22} />
                </motion.div>
              ) : (
                <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Sparkles size={22} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
            >
              {unreadCount}
            </motion.div>
          )}
          {/* Pulse ring - active based on route context for extra attention */}
          {!isOpen && (
            <div className={`absolute inset-0 rounded-2xl ${window.location.pathname === '/invoices' || window.location.pathname === '/payments'
              ? 'bg-teal-500/40 animate-[ping_2s_infinite]'
              : 'bg-teal-500/20 animate-[ping_3s_infinite]'
              }`} />
          )}
        </div>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] z-[100] flex flex-col overflow-hidden h-[calc(100vh-100px)] max-h-[600px] rounded-2xl shadow-2xl border border-white/[0.08] bg-[#0c0f1a]"
          >
            {/* Header */}
            <div className="relative px-5 py-4 border-b border-white/[0.06] bg-[#161a2b]/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.08),_transparent_60%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                      <Bot size={18} className="text-white" strokeWidth={2.2} />
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#161a2b] shadow-sm">
                      <div className="w-full h-full rounded-full bg-emerald-400 animate-ping [animation-duration:2s]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-tight">Malika AI</h3>
                    <p className="text-[11px] text-teal-400 font-semibold flex items-center gap-1.5">
                      Online · Copilot Mode
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearChat}
                    className="p-2 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-xl transition"
                    title="Clear chat"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-xl transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0c0f1a] custom-scrollbar"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx === messages.length - 1 ? 0.05 : 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="group max-w-[85%]">
                    <div
                      className={`relative p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.sender === 'user'
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-tr-md'
                        : 'bg-white/[0.03] text-gray-300 border border-white/[0.06] rounded-tl-md'
                        }`}
                    >
                      <div className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'prose-invert' : 'text-gray-300'} [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:mt-1 [&_li]:text-[13px]`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      {msg.data && msg.data.type === 'stat' && (
                        <div className="mt-2 text-lg font-extrabold bg-white/10 p-2.5 rounded-xl inline-block">
                          ₹{msg.data.value.toLocaleString()}
                        </div>
                      )}
                      {/* Copy for bot messages */}
                      {msg.sender === 'bot' && msg.text.length > 30 && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-gray-600"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>
                    {/* Timestamp */}
                    <p className={`text-[9px] font-medium mt-1 px-1 ${msg.sender === 'user' ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-md shadow-sm border border-white/[0.06] flex gap-1.5 items-center">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium ml-1">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice listening indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-center my-2"
                  >
                    <span className="flex items-center gap-2 text-[11px] text-red-600 font-bold bg-red-50 px-4 py-2 rounded-full border border-red-100">
                      <div className="relative">
                        <Mic size={12} />
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                      </div>
                      Listening...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scroll to bottom */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-[140px] left-1/2 -translate-x-1/2 p-1.5 bg-[#161a2b] border border-white/[0.08] rounded-full shadow-lg text-gray-400 hover:text-gray-200 transition z-10"
                >
                  <ChevronDown size={14} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0c0f1a]">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                  {routeActions[window.location.pathname] ? 'Suggested Actions' : 'Quick Actions'}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(personaActions[businessType as any] || routeActions[window.location.pathname] || defaultActions).map((action: any) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.query)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-teal-500/10 border border-white/[0.06] hover:border-teal-500/30 rounded-xl text-[11px] font-semibold text-gray-400 hover:text-teal-400 transition-all group"
                    >
                      <action.icon size={12} className="text-gray-500 group-hover:text-teal-500 transition-colors" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 bg-[#161a2b] border-t border-white/[0.06]">
              <div className="flex gap-2 items-center">
                <button
                  onClick={startListening}
                  className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${isListening
                    ? 'bg-red-500/10 text-red-500 ring-2 ring-red-500/20 animate-pulse'
                    : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'}`}
                  title="Voice Command"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Malika anything..."
                    className="w-full pl-4 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[13px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 focus:bg-white/[0.05] transition-all placeholder-gray-500 text-white"
                  />
                </div>

                <motion.button
                  onClick={() => handleSend()}
                  disabled={!query.trim() || isTyping}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-xl shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all flex-shrink-0"
                >
                  <Send size={16} />
                </motion.button>
              </div>
              <p className="text-center mt-2 text-[9px] text-gray-500 font-medium">
                Malika can make mistakes · Check important info
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
