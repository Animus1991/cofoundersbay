'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  User,
  Loader2,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDraggable } from '@/hooks/useDraggable';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Pre-defined responses for common questions (can be replaced with real AI later)
const FAQ_RESPONSES: Record<string, string> = {
  'what is cofounderbay': `CoFounderBay is a platform that connects founders, co-founders, mentors, and investors. We use AI-powered matching to help you find the perfect collaborators for your startup journey.

**Key Features:**
• AI-powered co-founder matching
• Mentor discovery and booking
• Community groups and events
• Milestone tracking for your startup
• Direct messaging with potential partners`,

  'how does matching work': `Our matching system uses AI to analyze your profile, skills, goals, and preferences to find compatible co-founders and mentors.

**The process:**
1. Complete your profile with skills and goals
2. Set your matching preferences
3. Our AI analyzes compatibility factors
4. You receive personalized match recommendations
5. Connect with matches that interest you`,

  'how to find a cofounder': `Finding a co-founder on CoFounderBay is easy:

1. **Complete your profile** - Add your skills, experience, and what you're looking for
2. **Browse matches** - Check your personalized recommendations
3. **Use filters** - Search by skills, location, or startup stage
4. **Send connection requests** - Reach out to promising matches
5. **Start conversations** - Use our messaging to get to know each other`,

  'how to become a mentor': `To become a mentor on CoFounderBay:

1. Go to **Settings** → **Mentor Profile**
2. Enable mentor mode
3. Add your expertise areas
4. Set your availability and rates (if applicable)
5. Your profile will appear in mentor searches

Mentors can offer guidance, office hours, and structured mentorship programs.`,

  'pricing': `CoFounderBay offers flexible pricing:

• **Free tier** - Basic matching, limited messages, community access
• **Pro tier** - Unlimited matching, advanced filters, priority support
• **Team tier** - For organizations with multiple founders

Visit the **Pricing** page for current rates and features.`,

  'how to message': `To message someone on CoFounderBay:

1. Visit their profile or match card
2. Click the **Message** button
3. Or use the chat bubble icon (bottom right)
4. Start a conversation!

You can also access all your conversations from the **Messages** page.`,

  'account settings': `You can manage your account in **Settings**:

• **Profile** - Update your bio, skills, and preferences
• **Notifications** - Control email and push notifications
• **Privacy** - Manage visibility and data
• **Security** - Change password, enable 2FA
• **Subscription** - Manage your plan`,

  'help': `I can help you with:

• **Getting started** - Profile setup, matching
• **Finding co-founders** - Search and connect
• **Mentorship** - Finding or becoming a mentor
• **Messaging** - How to communicate
• **Account** - Settings and preferences
• **Features** - Platform capabilities

Just ask me anything!`,
};

function findBestResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check for keyword matches
  if (lowerQuery.includes('what is') && (lowerQuery.includes('cofounderbay') || lowerQuery.includes('platform'))) {
    return FAQ_RESPONSES['what is cofounderbay'];
  }
  if (lowerQuery.includes('match') && (lowerQuery.includes('how') || lowerQuery.includes('work'))) {
    return FAQ_RESPONSES['how does matching work'];
  }
  if (lowerQuery.includes('cofounder') || lowerQuery.includes('co-founder') || lowerQuery.includes('find')) {
    return FAQ_RESPONSES['how to find a cofounder'];
  }
  if (lowerQuery.includes('mentor')) {
    return FAQ_RESPONSES['how to become a mentor'];
  }
  if (lowerQuery.includes('price') || lowerQuery.includes('pricing') || lowerQuery.includes('cost') || lowerQuery.includes('pay')) {
    return FAQ_RESPONSES['pricing'];
  }
  if (lowerQuery.includes('message') || lowerQuery.includes('chat') || lowerQuery.includes('talk')) {
    return FAQ_RESPONSES['how to message'];
  }
  if (lowerQuery.includes('setting') || lowerQuery.includes('account') || lowerQuery.includes('profile')) {
    return FAQ_RESPONSES['account settings'];
  }
  if (lowerQuery.includes('help') || lowerQuery.includes('support') || lowerQuery.includes('assist')) {
    return FAQ_RESPONSES['help'];
  }
  
  // Default response
  return `I'm here to help! I can answer questions about:

• **CoFounderBay platform** - What we offer
• **Finding co-founders** - Search and matching
• **Mentorship** - Connect with mentors
• **Messaging** - Communication features
• **Account settings** - Profile and preferences

What would you like to know more about?`;
}

const QUICK_ACTIONS = [
  { label: 'What is CoFounderBay?', icon: HelpCircle },
  { label: 'How does matching work?', icon: Sparkles },
  { label: 'Find a co-founder', icon: User },
  { label: 'Become a mentor', icon: Lightbulb },
];

export function AIAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Draggable functionality - position is offset from default bottom-left position
  const { position, isDragging, dragHandleProps } = useDraggable({
    storageKey: 'cfb-ai-assistant-position',
    initialPosition: { x: 0, y: 0 },
    boundaryPadding: 20,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = findBestResponse(content);
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (label: string) => {
    sendMessage(label);
  };

  // Hide on messages page (user is already chatting)
  const shouldHide = pathname?.startsWith('/messages');
  if (shouldHide) return null;

  // Closed state - show floating button (moved 60px more to the right: left-11 (44px) + 60px = 104px ≈ left-[104px])
  if (!isOpen) {
    return (
      <div
        className="fixed bottom-11 left-[104px] z-50 flex items-center gap-1"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white/80 shadow-md',
            'hover:from-violet-500 hover:to-purple-600 transition-all duration-150',
            isDragging && 'scale-95 opacity-80',
          )}
          style={{ width: '28px', height: '28px', ...dragHandleProps.style }}
          title="Drag to move"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        
        {/* Main button */}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center justify-center',
            'rounded-full shadow-lg transition-all duration-200',
            'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
            'hover:from-violet-600 hover:to-purple-700 hover:scale-105 active:scale-95',
            'outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
          )}
          style={{ width: '52px', height: '52px' }}
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
            <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
          </span>
        </button>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-28 left-[104px] z-40 flex items-center gap-1 animate-in slide-in-from-bottom-2"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white/80 shadow-md',
            'hover:from-violet-500 hover:to-purple-600 transition-all duration-150',
            isDragging && 'scale-95 opacity-80',
          )}
          style={{ width: '24px', height: '24px', ...dragHandleProps.style }}
          title="Drag to move"
        >
          <GripVertical className="h-3 w-3" />
        </div>
        
        <div
          className="flex items-center gap-2.5 cursor-pointer rounded-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg px-4 py-2.5 hover:shadow-xl transition-all duration-150"
          onClick={() => setIsMinimized(false)}
        >
          <Bot className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsMinimized(false); }}
            className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white/80" />
          </button>
        </div>
      </div>
    );
  }

  // Full popup
  return (
    <div
      className="fixed bottom-28 left-[104px] z-40 flex flex-col rounded-2xl border border-border
        bg-card shadow-2xl overflow-hidden
        animate-in slide-in-from-bottom-4 fade-in duration-200"
      style={{ 
        width: 380, 
        height: 520,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Header with drag handle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-gradient-to-r from-violet-500 to-purple-600">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-md text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors',
            isDragging && 'text-white/90 bg-white/10',
          )}
          style={{ width: '24px', height: '24px', ...dragHandleProps.style }}
          title="Drag to move"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex items-center gap-2 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            <p className="text-[10px] text-white/70">Powered by CoFounderBay</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
          aria-label="Minimize"
        >
          <ChevronDown className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={() => { setIsOpen(false); setIsMinimized(false); }}
          className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Welcome message */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted/50 px-4 py-3">
                <p className="text-sm text-foreground">
                  Hi! 👋 I'm your AI assistant. I can help you navigate CoFounderBay, find co-founders, connect with mentors, and answer any questions about the platform.
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="pl-11">
              <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickAction(label)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                      : 'bg-primary',
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    'flex-1 rounded-2xl px-4 py-3 max-w-[85%]',
                    msg.role === 'assistant'
                      ? 'rounded-tl-sm bg-muted/50'
                      : 'rounded-tr-sm bg-primary text-primary-foreground ml-auto',
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {msg.content.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 h-10 rounded-full bg-muted/50 border-0 px-4 text-sm focus-visible:ring-1 focus-visible:ring-violet-500"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI responses are for guidance only. For account issues, contact support.
        </p>
      </form>
    </div>
  );
}
