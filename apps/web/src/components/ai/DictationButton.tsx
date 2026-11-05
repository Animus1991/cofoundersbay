'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { bilingualAria } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { cn } from '@/lib/utils';

/**
 * Dictation into the question box, on phones (docs §107.7-7, §111).
 *
 * The browser's own speech recognition (Web Speech API), where it exists and
 * the screen is a touch screen: typing a question is the hard part there. The
 * words go into the box, not straight to the assistant, so the reader sees
 * and can correct them before sending. While it listens, the button says so
 * in words, not only by colour. Where the API is missing the button is not
 * drawn; nothing is promised that the device cannot do.
 */

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognitionConstructor(): (new () => RecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Whether dictation is offered here: the API exists and the pointer is a finger. */
export function dictationAvailable(): boolean {
  if (!recognitionConstructor()) return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

export function DictationButton({
  value,
  onChange,
  className,
  size = 'default',
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  size?: 'default' | 'small';
}) {
  const { primary } = useLanguagePreference();
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [failed, setFailed] = useState(false);
  const recognition = useRef<RecognitionLike | null>(null);
  const base = useRef('');

  // After mount: the server cannot know the device.
  useEffect(() => setAvailable(dictationAvailable()), []);
  useEffect(() => () => recognition.current?.abort(), []);

  const stop = useCallback(() => {
    recognition.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Recognition = recognitionConstructor();
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = primary === 'el' ? 'el-GR' : 'en-GB';
    rec.interimResults = true;
    rec.continuous = false;
    base.current = value.trim() ? `${value.trim()} ` : '';
    rec.onresult = (event) => {
      let heard = '';
      for (let i = 0; i < event.results.length; i += 1) heard += event.results[i][0]?.transcript ?? '';
      onChange(`${base.current}${heard}`.replace(/\s+/g, ' ').trimStart());
    };
    rec.onend = () => {
      setListening(false);
      recognition.current = null;
    };
    rec.onerror = (event) => {
      // "no-speech" and "aborted" are a silence or a stop, not a fault.
      if (event?.error && event.error !== 'no-speech' && event.error !== 'aborted') setFailed(true);
    };
    recognition.current = rec;
    setFailed(false);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setFailed(true);
    }
  }, [onChange, primary, value]);

  if (!available) return null;

  const label = listening
    ? bilingualAria('Stop dictation', 'Διακοπή υπαγόρευσης')
    : failed
      ? bilingualAria('Dictation did not work. Try again', 'Η υπαγόρευση δεν λειτούργησε. Δοκιμάστε ξανά')
      : bilingualAria('Dictate the question', 'Υπαγόρευση της ερώτησης');

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5', className)}>
      {listening ? (
        // In words as well as colour: the field is listening.
        <span role="status" className="inline-flex items-center gap-1 text-xs font-medium text-status-danger">
          <span className="h-2 w-2 animate-pulse rounded-full bg-status-danger-mark" aria-hidden="true" />
          <BilingualText en="Listening…" el="Ακούω…" compact />
        </span>
      ) : null}
      <Button
        type="button"
        size="icon"
        variant={listening ? 'default' : 'ghost'}
        aria-pressed={listening}
        aria-label={label}
        title={label}
        data-keep-icon=""
        onClick={listening ? stop : start}
        className={cn(size === 'small' ? 'h-8 w-8 rounded-lg' : 'h-11 w-11 rounded-full', failed && !listening && 'text-status-danger')}
      >
        {listening ? <MicOff className="icon-sm" aria-hidden="true" /> : <Mic className="icon-sm" aria-hidden="true" />}
      </Button>
    </span>
  );
}
