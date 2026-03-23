import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Mic, MicOff, Zap, FileText, TrendingUp, Users, RotateCcw, Copy, Check, ChevronDown, AlertTriangle, CreditCard, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../services/aiService';
import { usePersona } from '../contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';
import { Logo } from '../components/common/Logo';

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
  { label: 'Recent expenses', icon: CreditCard, query: 'Show me my last 5 expenses' },
  { label: 'Draft invoice', icon: FileText, query: 'Help me create a new invoice' },
  { label: 'Business health', icon: Zap, query: 'Give me a business health summary' },
  { label: 'Top customers', icon: Users, query: 'Who are my top customers?' },
  { label: 'Net cash flow', icon: Activity, query: 'What is my current net cash flow?' },
];

const routeActions: Record<string, typeof defaultActions> = {};

const personaActions: Record<string, typeof defaultActions> = {
  'solopreneur': [
    { label: 'Tax estimate', icon: Zap, query: 'Estimate my taxes for this quarter' },
    { label: 'Expense check', icon: CreditCard, query: 'Show me my expenses for this month' },
    { label: 'Cash availability', icon: Activity, query: 'How much cash is safe to spend?' },
    { label: 'Personal vs Biz', icon: Users, query: 'Analyze my business spending habits' },
  ],
  'subscription': [
    { label: 'Check MRR', icon: TrendingUp, query: 'What is my current Monthly Recurring Revenue?' },
    { label: 'Churn report', icon: Users, query: 'Analyze my customer churn' },
    { label: 'Growth rate', icon: Activity, query: 'What is my revenue growth month-over-month?' },
    { label: 'LTV analysis', icon: Zap, query: 'What is the average customer lifetime value?' },
  ],
  'services_firm': [
    { label: 'Project profit', icon: TrendingUp, query: 'Which projects are most profitable?' },
    { label: 'Unbilled work', icon: Clock, query: 'Show me all unbilled hours' },
    { label: 'Retainer risks', icon: AlertTriangle, query: 'Are any client retainers nearly empty?' },
    { label: 'Team burn rate', icon: Activity, query: 'What is our current monthly burn rate?' },
  ],
  'ecommerce': [
    { label: 'Stock risks', icon: AlertTriangle, query: 'Which products are at risk of stockout?' },
    { label: 'Dead stock ₹', icon: Zap, query: 'How much capital is locked in dead stock?' },
    { label: 'Refund rate', icon: RotateCcw, query: 'What is my current refund rate?' },
    { label: 'Sales velocity', icon: TrendingUp, query: 'Which items are selling fastest today?' },
  ]
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function AIAssistantPage() {
  const { businessType } = usePersona();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const getGreeting = () => {
    switch (businessType) {
      case 'solopreneur': return "Hey! I'm **Capita**. I'll keep your personal finances organized and your cash flow clear. What's on your mind?";
      case 'subscription': return "Systems Nominal. **Capita** here. I'm tracking your MRR, churn, and subscriptions. Ready for growth metrics?";
      case 'services_firm': return "Hello! **Capita** here. I'm monitoring your client retainers and billable hours. How can I help you today?";
      case 'ecommerce': return "Inventory secure. **Capita** active. I'm tracking your replenishment risks and store health. What do you need?";
      default: return "Hey! 👋 I'm **Capita**, your financial copilot. I can help you check revenue, find invoices, analyze trends, or create new ones. What would you like to do?";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      let response = await aiService.processQuery(userMsg.text, undefined, businessType || undefined);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        data: response.data,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      const action = response.action;
      if (action) {
        if (action.type === 'open_invoice_modal' || action.type === 'EXECUTE_ACTION') {
          const initialData = action.data && action.type === 'EXECUTE_ACTION' ? {
            buyer: { name: action.data.customer, phone: '' },
            items: [{ description: action.data.description || 'Service', quantity: 1, price: action.data.amount, unit: 'Qty', discount: 0 }]
          } : (action.initialData || action.data);

          window.dispatchEvent(new CustomEvent('open-invoice-modal', { detail: initialData }));
        } else if (action.type === 'navigate' && action.data?.to) {
          setTimeout(() => {
            let targetPath = action.data.to;
            if (targetPath.startsWith('/') && !targetPath.startsWith('/dashboard') && !['/login', '/setup', '/pricing'].includes(targetPath)) {
              targetPath = `/dashboard${targetPath === '/' ? '' : targetPath}`;
            }
            navigate(targetPath);
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
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-[#0c0f1a]">
      {/* Header */}
      <div className="relative px-6 py-5 border-b border-white/[0.06] bg-[#161a2b]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.08),_transparent_60%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Logo size={48} />
              {/* Online dot */}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161a2b] shadow-sm">
                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping [animation-duration:2s]" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg text-white tracking-tight">Capita AI</h2>
              <p className="text-xs text-teal-400 font-semibold flex items-center gap-1.5 mt-0.5">
                Online · Copilot Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition"
              title="Clear chat"
            >
              <RotateCcw size={16} />
              Reset Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#0c0f1a] custom-scrollbar relative"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx === messages.length - 1 ? 0.05 : 0 }}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`group max-w-[85%] lg:max-w-[75%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.sender === 'bot' && (
                <div className="flex-shrink-0 mt-1">
                  <Logo size={32} showBackground={true} showBorder={false} />
                </div>
              )}
              <div
                className={`relative p-4 rounded-3xl text-[14px] leading-relaxed shadow-sm ${msg.sender === 'user'
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-tr-md'
                  : 'bg-white/[0.03] text-gray-200 border border-white/[0.06] rounded-tl-md'
                  }`}
              >
                <div className={`prose prose-sm max-w-none ${msg.sender === 'user' ? 'prose-invert' : 'text-gray-200'} [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:mt-1.5 [&_li]:text-[14px]`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.data && msg.data.type === 'stat' && (
                  <div className="mt-3 text-2xl font-extrabold bg-white/10 px-4 py-2.5 rounded-xl inline-block">
                    ₹{msg.data.value.toLocaleString()}
                  </div>
                )}
                {/* Copy for bot messages */}
                {msg.sender === 'bot' && msg.text.length > 30 && (
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[#161a2b] border border-white/[0.08] rounded-xl shadow-lg text-gray-400 hover:text-gray-200"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
              {/* Timestamp */}
              <p className={`text-[10px] font-medium mt-1.5 px-1 flex-shrink-0 ${msg.sender === 'user' ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex justify-start gap-3"
            >
              <div className="flex-shrink-0 mt-1">
                <Logo size={32} showBackground={true} showBorder={false} />
              </div>
              <div className="bg-white/[0.03] px-4 py-3.5 rounded-3xl rounded-tl-md shadow-sm border border-white/[0.06] flex gap-2 items-center h-[52px]">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[12px] text-gray-400 font-medium ml-2">Capita is analyzing...</span>
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
              className="flex justify-center my-4"
            >
              <span className="flex items-center gap-3 text-sm text-red-500 font-bold bg-red-500/10 px-6 py-3 rounded-full border border-red-500/20">
                <div className="relative">
                  <Mic size={16} />
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                </div>
                Listening to your command...
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
            className="absolute bottom-[160px] left-1/2 -translate-x-1/2 p-2 bg-[#161a2b] border border-white/[0.08] rounded-full shadow-xl text-gray-400 hover:text-white transition z-10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#161a2b]/50"
          >
            <ChevronDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Suggestions - Horizontal Scroll */}
      {!isTyping && (
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0c0f1a]">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar-hide -mx-2 px-2">
            {([...(personaActions[businessType as any] || []), ...(routeActions[location.pathname] || []), ...defaultActions]
              .filter((v, i, a) => a.findIndex(t => t.label === v.label) === i) // Unique actions
              .slice(0, 8) // Limit to 8
            ).map((action: any) => (
              <button
                key={action.label}
                type="button"
                onClick={(e) => { e.preventDefault(); handleSend(action.query); }}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-teal-500/10 border border-white/[0.06] hover:border-teal-500/30 rounded-full text-[13px] font-medium text-gray-300 hover:text-teal-400 transition-all group whitespace-nowrap"
              >
                <action.icon size={15} className="text-gray-500 group-hover:text-teal-500 transition-colors" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-5 bg-[#161a2b] border-t border-white/[0.06]">
        <div className="flex gap-3 items-center">
          <button
            onClick={startListening}
            className={`p-3 rounded-2xl transition-all flex-shrink-0 ${isListening
              ? 'bg-red-500/10 text-red-500 ring-2 ring-red-500/20 animate-pulse'
              : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 border border-white/[0.06]'}`}
            title="Voice Command"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask Capita to generate reports, check balances, or guide you..."
              className="w-full pl-5 pr-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-[15px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 focus:bg-white/[0.05] transition-all placeholder-gray-500 text-white shadow-inner"
            />
          </div>

          <motion.button
            type="button"
            onClick={(e) => { e.preventDefault(); handleSend(); }}
            disabled={!query.trim() || isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl shadow-xl shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all flex-shrink-0"
          >
            <Send size={20} />
          </motion.button>
        </div>
        <p className="text-center mt-3 text-[11px] text-gray-500 font-medium">
          Capita AI analyzes your financial data using secure edge models. Always verify important numbers.
        </p>
      </div>
    </div>
  );
}
