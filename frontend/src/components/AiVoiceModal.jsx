import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Send, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { translations } from '../translations';

export default function AiVoiceModal({ isOpen, onClose, language = 'hi', onNavigateTab }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef(null);

  const t = translations[language] || translations.hi;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setMicError('');
        };

        recognition.onresult = (event) => {
          const speech = event.results[0][0].transcript;
          setTranscript(speech);
          handleProcessVoice(speech);
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          setMicError('Microphone not detected or permission denied. Type below.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setMicError('Speech recognition is not supported in this browser. Please type your query.');
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setAiResponse(null);
      setMicError('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Mic start error:', err);
      }
    }
  };

  const handleProcessVoice = async (queryText) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.processVoiceIntent({ speechText: queryText, language });
      if (res.success && res.data) {
        setAiResponse(res.data);
        speakResponse(res.data.replyText);

        // Auto-navigate if mapped
        if (res.data.intent === 'QUEUE_STATUS' && onNavigateTab) onNavigateTab('liveQueue');
        if (res.data.intent === 'CHECK_PAYMENT' && onNavigateTab) onNavigateTab('payments');
        if (res.data.intent === 'NEAREST_CENTRE' && onNavigateTab) onNavigateTab('centres');
        if (res.data.intent === 'BOOK_SLOT' && onNavigateTab) onNavigateTab('bookSlot');
        if (res.data.intent === 'TODAY_PROCUREMENT' && onNavigateTab) onNavigateTab('crops');
      }
    } catch (err) {
      console.error('Voice intent failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePromptClick = (prompt) => {
    setTranscript(prompt);
    handleProcessVoice(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-[#1F2E22] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C98A2E]/20 flex items-center justify-center border border-[#C98A2E]/40">
              <Sparkles className="w-5 h-5 text-[#C98A2E]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                {t.voiceAssistant}
                <span className="text-xs font-sans font-semibold bg-[#C98A2E] text-black px-2 py-0.5 rounded-full">
                  AI v2.6
                </span>
              </h3>
              <p className="text-xs text-white/70">
                {language === 'hi' ? 'हिंदी में बोलें' : language === 'te' ? 'తెలుగులో మాట్లాడండి' : 'Speak in English'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Microphone Interactive Section */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-gradient-to-tr from-rust to-red-500 text-white shadow-xl shadow-rust/40 pulse-active'
                  : 'bg-gradient-to-tr from-[#1F2E22] to-[#2D4232] text-white hover:scale-105 shadow-lg'
              }`}
            >
              {isListening ? <Mic className="w-10 h-10 animate-pulse" /> : <Mic className="w-10 h-10" />}
            </button>
            <p className="mt-4 text-sm font-medium text-ink">
              {isListening ? t.voiceListening : 'Tap microphone to speak'}
            </p>
            {micError && <p className="mt-1 text-xs text-rust font-medium">{micError}</p>}
          </div>

          {/* Transcript / AI Response Bubble */}
          {(transcript || aiResponse || isLoading) && (
            <div className="bg-[#F8F6F0] border border-border rounded-xl p-4 space-y-3">
              {transcript && (
                <div className="flex items-start gap-2 text-sm text-ink/80">
                  <span className="font-semibold text-xs text-sage uppercase">You:</span>
                  <p className="italic">"{transcript}"</p>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-ink/70">
                  <span className="w-2 h-2 rounded-full bg-gold animate-ping"></span>
                  Processing natural language intent...
                </div>
              ) : (
                aiResponse && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-gold" /> Intent: {aiResponse.intent}
                      </span>
                      <button
                        onClick={() => speakResponse(aiResponse.replyText)}
                        className="text-xs text-gold flex items-center gap-1 hover:underline"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Replay Voice
                      </button>
                    </div>
                    <p className="text-sm font-medium text-ink bg-white p-3 rounded-lg border border-border">
                      {aiResponse.replyText}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Quick Prompts Chips */}
          <div>
            <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {t.quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs bg-white hover:bg-[#F8F6F0] border border-border hover:border-gold px-3 py-1.5 rounded-full text-ink transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>{prompt}</span>
                  <ArrowRight className="w-3 h-3 text-gold opacity-60" />
                </button>
              ))}
            </div>
          </div>

          {/* Type Query Fallback Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) {
                setTranscript(inputText);
                handleProcessVoice(inputText);
                setInputText('');
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.voicePlaceholder}
              className="input-field flex-1 text-xs"
            />
            <button type="submit" className="btn-primary py-2 px-3 text-xs">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
