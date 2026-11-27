import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bot, Send, Sparkles, TrendingDown, User } from 'lucide-react';
import { MAX_PROMPT_LENGTH } from '../constants';
import { generateAiResponse } from '../services/vayuAiEngine';
import type { AirQualityData, ChatMessage, HouseholdProfile } from '../types/vayunex';
import { createId, formatTimeLabel, sanitizeText } from '../utils/helpers';
import { Card } from './ui/Card';

interface AiAssistantProps {
  aq: AirQualityData;
  profile: HouseholdProfile;
  geminiApiKey?: string;
}

const STARTER_PROMPTS = [
  'Plan today’s low-emission family schedule',
  'Recommend low-cost indoor air quality measures',
  'Analyze how my cooking fuel affects indoor air',
  'Compare low-emission commute alternatives',
];

function renderFormattedText(text: string): React.ReactNode {
  return text.split('\n').map((line, idx) => {
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="mt-2 mb-1.5 font-display text-base font-bold text-slate-900">
          {line.replace('### ', '')}
        </h3>
      );
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim())) {
      return (
        <p key={idx} className="ml-2 mb-1 text-sm leading-relaxed text-slate-700">
          {rendered}
        </p>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="mb-1 text-sm leading-relaxed text-slate-700">
        {rendered}
      </p>
    );
  });
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ aq, profile, geminiApiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### VayuNex Advisory — ${aq.city.name}

Synchronized with **${aq.city.name}’s current AQI (${aq.aqi})** and your **${profile.familySize}-person ${profile.homeType}** profile. Ask for a tailored daily schedule, indoor air quality interventions, or the quantified health and emission impact of your daily choices.`,
      timestamp: formatTimeLabel(),
      suggestedActions: STARTER_PROMPTS,
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendPrompt = async (text: string) => {
    const trimmed = sanitizeText(text, MAX_PROMPT_LENGTH);
    if (!trimmed || thinking) return;

    const userMsg: ChatMessage = {
      id: createId('u'),
      role: 'user',
      content: trimmed,
      timestamp: formatTimeLabel(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const reply = await generateAiResponse(trimmed, aq, profile, geminiApiKey);

    const botMsg: ChatMessage = {
      id: createId('a'),
      role: 'assistant',
      content: reply.content,
      timestamp: formatTimeLabel(),
      impactCards: reply.impactCards,
      suggestedActions: reply.suggestedActions,
    };

    setMessages((prev) => [...prev, botMsg]);
    setThinking(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 flex h-[640px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white" aria-hidden="true">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">VayuNex GenAI Advisor</div>
              <div className="text-xs text-slate-500">
                Context: {aq.city.name} (AQI {aq.aqi}) • {profile.householdName}
              </div>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            {geminiApiKey ? 'Gemini Live Connected' : 'VayuNex Smart Engine'}
          </span>
        </div>

        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation history"
          className="flex-1 space-y-5 overflow-y-auto p-5"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200/80 bg-slate-50/70 text-slate-800'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <div>{renderFormattedText(msg.content)}</div>
                )}

                {msg.impactCards && msg.impactCards.length > 0 && (
                  <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {msg.impactCards.map((card) => (
                      <div key={card.label} className="rounded-xl border border-emerald-200/80 bg-white p-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <TrendingDown className="h-3 w-3" aria-hidden="true" />
                          {card.label}
                        </div>
                        <div className="mt-0.5 font-mono-num text-sm font-bold text-slate-900">
                          {card.value}
                        </div>
                        <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{card.detail}</div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendPrompt(s)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        {s}
                        <ArrowUpRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700" aria-hidden="true">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <span>Analyzing {aq.city.name} hourly smog curve &amp; household impact...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          className="border-t border-slate-200 bg-white p-3.5"
        >
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
            <input
              type="text"
              maxLength={MAX_PROMPT_LENGTH}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask VayuNex AI"
              placeholder="Ask about safe outdoor hours, DIY purifiers, cooking swaps, or masks..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-4 space-y-4">
        <Card className="p-5">
          <h3 className="font-display text-sm font-bold text-slate-900">
            Active Personalization Context
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Every AI recommendation is automatically calibrated to these parameters:
          </p>
          <dl className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Location &amp; AQI</dt>
              <dd className="font-semibold text-slate-800">
                {aq.city.name} ({aq.aqi})
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Household</dt>
              <dd className="font-semibold text-slate-800">
                {profile.familySize} members ({profile.homeType})
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Sensitivity</dt>
              <dd className="font-semibold text-slate-800 capitalize">
                {profile.respiratorySensitivity.replace('_', ' / ')}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Cooking Fuel</dt>
              <dd className="font-semibold text-slate-800 capitalize">
                {profile.cookingFuel.replace('_', ' / ')}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Primary Commute</dt>
              <dd className="font-semibold text-slate-800 capitalize">
                {profile.primaryCommute.replace('_', ' / ')}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-bold text-slate-900">Quick Prompts</h3>
          <div className="mt-3 space-y-2">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendPrompt(p)}
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-900"
              >
                {p}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
