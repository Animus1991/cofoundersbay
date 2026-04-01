'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { analytics } from '@/lib/analytics';
import Daily from '@daily-co/daily-js';

type CallState = 'idle' | 'joining' | 'joined' | 'leaving' | 'error';

interface VideoCallContextValue {
  state: CallState;
  roomUrl: string | null;
  error: string | null;
  participants: Array<{ id: string; userName?: string; audio: boolean; video: boolean }>;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  startCall: (roomUrl: string) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
}

const VideoCallContext = createContext<VideoCallContextValue | null>(null);

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CallState>('idle');
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<VideoCallContextValue['participants']>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const { success, error: showError } = useToast();
  
  const callObjectRef = useRef<any>(null);

  // Initialize call object
  useEffect(() => {
    if (!callObjectRef.current) {
      callObjectRef.current = Daily.createCallObject({
        showLocalVideo: true,
        showLeaveButton: false,
      });
    }

    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
        callObjectRef.current = null;
      }
    };
  }, []);

  // Handle Daily events
  useEffect(() => {
    const callObject = callObjectRef.current;
    if (!callObject) return;

    const handleJoinedMeeting = () => {
      setState('joined');
      setCallStartTime(Date.now());
      success('Call started', 'You have joined the video call');
      
      void analytics.track('video_call_started', { room_id: roomUrl || 'unknown', call_type: 'mentoring' });
    };

    const handleLeftMeeting = () => {
      const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
      void analytics.track('video_call_ended', { 
        room_id: roomUrl || 'unknown', 
        duration_seconds: duration 
      });
      
      setState('idle');
      setRoomUrl(null);
      setError(null);
      setParticipants([]);
      setIsMuted(false);
      setIsVideoOff(false);
      setIsScreenSharing(false);
      setCallStartTime(null);
    };

    const handleError = (error: any) => {
      const message = error?.errorMsg || 'Failed to join call';
      setError(message);
      setState('error');
      showError('Call failed', message);
      
      void analytics.track('video_call_error', { room_id: roomUrl || 'unknown', error: message });
    };

    const handleParticipantJoined = (event: any) => {
      if (event?.participants) {
        const newParticipants = Object.values(event.participants).map((p: any) => ({
          id: p.user_id || p.session_id || 'unknown',
          userName: p.user_name || p.owner_name || 'Unknown',
          audio: p.audio || false,
          video: p.video || false,
        }));
        setParticipants(prev => [...prev, ...newParticipants]);
      }
    };

    const handleParticipantLeft = (event: any) => {
      if (event?.participants) {
        const leftIds = Object.keys(event.participants);
        setParticipants(prev => prev.filter(p => !leftIds.includes(p.id)));
      }
    };

    const handleParticipantUpdated = (event: any) => {
      if (event?.participants) {
        setParticipants(prev => 
          prev.map(p => {
            const updated = event.participants[p.id];
            if (updated) {
              return {
                ...p,
                audio: updated.audio || false,
                video: updated.video || false,
              };
            }
            return p;
          })
        );
      }
    };

    // Register event listeners
    callObject.on('joined-meeting', handleJoinedMeeting);
    callObject.on('left-meeting', handleLeftMeeting);
    callObject.on('error', handleError);
    callObject.on('participant-joined', handleParticipantJoined);
    callObject.on('participant-left', handleParticipantLeft);
    callObject.on('participant-updated', handleParticipantUpdated);

    return () => {
      callObject.off('joined-meeting', handleJoinedMeeting);
      callObject.off('left-meeting', handleLeftMeeting);
      callObject.off('error', handleError);
      callObject.off('participant-joined', handleParticipantJoined);
      callObject.off('participant-left', handleParticipantLeft);
      callObject.off('participant-updated', handleParticipantUpdated);
    };
  }, [roomUrl, callStartTime, success, showError]);

  const startCall = async (url: string) => {
    const callObject = callObjectRef.current;
    if (!callObject) {
      setError('Call object not initialized');
      setState('error');
      return;
    }

    setState('joining');
    setRoomUrl(url);
    setError(null);
    
    try {
      // Join the Daily.co room
      await callObject.join({
        url,
        userName: 'You', // This should come from user context
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      setError(message);
      setState('error');
      showError('Call failed', message);
      void analytics.track('video_call_error', { room_id: url, error: message });
    }
  };

  const endCall = () => {
    const callObject = callObjectRef.current;
    if (!callObject || state === 'idle') return;
    
    setState('leaving');
    callObject.leave();
  };

  const toggleMute = useCallback(() => {
    const callObject = callObjectRef.current;
    if (!callObject || state !== 'joined') return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      callObject.setLocalAudio(false);
    } else {
      callObject.setLocalAudio(true);
    }
  }, [isMuted, state]);

  const toggleVideo = useCallback(() => {
    const callObject = callObjectRef.current;
    if (!callObject || state !== 'joined') return;

    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    
    if (newVideoOff) {
      callObject.setLocalVideo(false);
    } else {
      callObject.setLocalVideo(true);
    }
  }, [isVideoOff, state]);

  const toggleScreenShare = useCallback(() => {
    const callObject = callObjectRef.current;
    if (!callObject || state !== 'joined') return;

    const newSharing = !isScreenSharing;
    setIsScreenSharing(newSharing);
    
    if (newSharing) {
      callObject.startScreenShare();
      success('Screen sharing started', 'Others can now see your screen');
    } else {
      callObject.stopScreenShare();
      success('Screen sharing stopped', 'Your screen is no longer visible');
    }
  }, [isScreenSharing, state, success]);

  const value: VideoCallContextValue = {
    state,
    roomUrl,
    error,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within VideoCallProvider');
  }
  return context;
}
