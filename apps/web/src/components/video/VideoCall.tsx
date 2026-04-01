'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Phone, 
  Users, Settings, Maximize2, Minimize2 
} from 'lucide-react';
import { useVideoCall } from './VideoCallProvider';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  className?: string;
}

export function VideoCall({ className }: VideoCallProps) {
  const {
    state,
    participants,
    isMuted,
    isVideoOff,
    isScreenSharing,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useVideoCall();

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // Handle video element mounting
  useEffect(() => {
    if (state === 'joined' && localVideoRef.current) {
      // Daily.co will automatically mount local video in this element
      // when the call is joined
    }
  }, [state]);

  if (state === 'idle') {
    return null;
  }

  return (
    <Card className={cn('fixed inset-4 z-50 shadow-2xl', className)}>
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <Badge variant={state === 'joined' ? 'default' : 'secondary'}>
              {state === 'joining' && 'Joining...'}
              {state === 'joined' && 'Connected'}
              {state === 'leaving' && 'Leaving...'}
              {state === 'error' && 'Error'}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </div>
            {isScreenSharing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Monitor className="h-3 w-3 mr-1" />
                Sharing
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={endCall}
              className="gap-1"
            >
              <Phone className="h-4 w-4" />
              Leave
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Main Video (Remote or Screen Share) */}
          <div 
            ref={remoteVideoRef}
            className="absolute inset-0"
            id="remote-video-container"
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div 
            ref={localVideoRef}
            className={cn(
              'absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700',
              'transition-all duration-200 hover:scale-105'
            )}
            id="local-video-container"
          />
          
          {/* Participants Grid when no video */}
          {participants.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Waiting for others to join...</p>
                <p className="text-sm opacity-75">Share this room URL to invite participants</p>
              </div>
            </div>
          )}

          {/* Connection Status Overlay */}
          {state === 'joining' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">Joining call...</p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-red-300 mb-4">
                  <Phone className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-lg font-medium">Connection failed</p>
                <p className="text-sm opacity-75">Please check your connection and try again</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 p-4 border-t bg-muted/50">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="sm"
            onClick={toggleMute}
            className="gap-1"
            disabled={state !== 'joined'}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          
          <Button
            variant={isVideoOff ? 'destructive' : 'secondary'}
            size="sm"
            onClick={toggleVideo}
            className="gap-1"
            disabled={state !== 'joined'}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            {isVideoOff ? 'Start Video' : 'Stop Video'}
          </Button>
          
          <Button
            variant={isScreenSharing ? 'default' : 'secondary'}
            size="sm"
            onClick={toggleScreenShare}
            className="gap-1"
            disabled={state !== 'joined'}
          >
            {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </Button>
        </div>

        {/* Participants Sidebar (optional) */}
        {participants.length > 0 && (
          <div className="w-64 border-l bg-muted/30 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium">{participant.userName}</span>
                  <div className="flex gap-1 ml-auto">
                    {participant.audio && <Mic className="h-3 w-3 text-green-500" />}
                    {participant.video && <Video className="h-3 w-3 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
