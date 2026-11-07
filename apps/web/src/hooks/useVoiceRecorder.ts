'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Long enough for a real message, short enough to stay under the 20 MB upload limit. */
export const MAX_VOICE_SECONDS = 120;

/** What each browser records, in the order to try: the API checks the bytes against these. */
const FORMATS = [
  { mime: 'audio/webm;codecs=opus', type: 'audio/webm', extension: 'webm' },
  { mime: 'audio/webm', type: 'audio/webm', extension: 'webm' },
  { mime: 'audio/mp4', type: 'audio/mp4', extension: 'm4a' },
  { mime: 'audio/ogg;codecs=opus', type: 'audio/ogg', extension: 'ogg' },
] as const;

export type VoiceFailure = 'denied' | 'unavailable';

export function voiceRecordingSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.MediaRecorder !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && FORMATS.some((format) => window.MediaRecorder.isTypeSupported(format.mime));
}

/**
 * One voice note at a time. The microphone is released the moment recording
 * stops or is cancelled, so the browser's recording mark does not stay on.
 */
export function useVoiceRecorder(onFinished: (file: File) => void) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);
  const finished = useRef(onFinished);
  finished.current = onFinished;

  const release = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
    setSeconds(0);
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelled.current = true;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    else release();
  }, [release]);

  const start = useCallback(async (): Promise<VoiceFailure | null> => {
    if (recorder.current) return null;
    const format = FORMATS.find((item) => typeof window !== 'undefined' && window.MediaRecorder?.isTypeSupported(item.mime));
    if (!format || !navigator.mediaDevices?.getUserMedia) return 'unavailable';
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      return err instanceof DOMException && err.name === 'NotAllowedError' ? 'denied' : 'unavailable';
    }
    const chunks: Blob[] = [];
    const next = new MediaRecorder(stream.current, { mimeType: format.mime });
    next.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
    next.onstop = () => {
      const dropped = cancelled.current;
      cancelled.current = false;
      release();
      if (dropped || chunks.length === 0) return;
      finished.current(new File(chunks, `voice-note.${format.extension}`, { type: format.type }));
    };
    recorder.current = next;
    cancelled.current = false;
    next.start();
    setRecording(true);
    setSeconds(0);
    timer.current = setInterval(() => {
      setSeconds((value) => {
        if (value + 1 >= MAX_VOICE_SECONDS) stop();
        return value + 1;
      });
    }, 1000);
    return null;
  }, [release, stop]);

  // Leaving the thread mid-recording drops the note and frees the microphone.
  useEffect(() => () => {
    cancelled.current = true;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    if (timer.current) clearInterval(timer.current);
  }, []);

  return { recording, seconds, start, stop, cancel };
}
