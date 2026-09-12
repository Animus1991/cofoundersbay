'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  UserPlus, 
  Briefcase, 
  Calendar,
  TrendingUp,
  Award,
  Rocket,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'post' | 'connection' | 'opportunity' | 'event' | 'achievement' | 'milestone';
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  content: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    tags?: string[];
    stats?: {
      likes?: number;
      comments?: number;
      shares?: number;
    };
  };
  createdAt: string;
  isLiked?: boolean;
}

const ACTIVITY_CONFIG = {
  post: { icon: MessageSquare, color: 'text-status-info', bg: 'bg-status-info-bg' },
  connection: { icon: UserPlus, color: 'text-status-success', bg: 'bg-status-success-bg' },
  opportunity: { icon: Briefcase, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
  event: { icon: Calendar, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
  achievement: { icon: Award, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
  milestone: { icon: Rocket, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
};

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const response = await fetch('/api/v1/activity/feed', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      return data.activities || [];
    },
    refetchInterval: 30000,
  });

  const handleLike = async (activityId: string) => {
    try {
      await fetch(`/api/v1/activity/${activityId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
    } catch (error) {
      console.error('Failed to like activity:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/40 animate-pulse"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-secondary/40 rounded w-1/3 animate-pulse"></div>
                  <div className="h-4 bg-secondary/40 rounded w-2/3 animate-pulse"></div>
                  <div className="h-20 bg-secondary/40 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity: Activity) => {
        const config = ACTIVITY_CONFIG[activity.type];
        const Icon = config.icon;

        return (
          <Card key={activity.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                  <AvatarFallback>{activity.userName[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{activity.userName}</span>
                      {activity.userRole && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.userRole}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        • {formatTime(activity.createdAt)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="icon-sm" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('p-1.5 rounded-lg', config.bg)}>
                      <Icon className={cn('icon-sm', config.color)} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {activity.type === 'post' && 'shared a post'}
                      {activity.type === 'connection' && 'connected with someone'}
                      {activity.type === 'opportunity' && 'posted an opportunity'}
                      {activity.type === 'event' && 'created an event'}
                      {activity.type === 'achievement' && 'earned an achievement'}
                      {activity.type === 'milestone' && 'reached a milestone'}
                    </span>
                  </div>

                  <p className="text-sm mb-3 whitespace-pre-wrap">{activity.content}</p>

                  {activity.metadata && (
                    <div className="space-y-3">
                      {activity.metadata.title && (
                        <div className="p-4 rounded-lg border bg-secondary/20">
                          <h4 className="font-semibold mb-1">{activity.metadata.title}</h4>
                          {activity.metadata.description && (
                            <p className="text-sm text-muted-foreground">
                              {activity.metadata.description}
                            </p>
                          )}
                        </div>
                      )}

                      {activity.metadata.image && (
                        <img
                          src={activity.metadata.image}
                          alt="Activity"
                          className="rounded-lg w-full object-cover max-h-96"
                        />
                      )}

                      {activity.metadata.tags && activity.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {activity.metadata.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="rounded-full">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(activity.id)}
                      className={cn(
                        'flex-1',
                        activity.isLiked && 'text-status-danger'
                      )}
                    >
                      <Heart className={cn('icon-sm mr-2', activity.isLiked && 'fill-current')} />
                      {activity.metadata?.stats?.likes || 0}
                    </Button>

                    <Button variant="ghost" size="sm" className="flex-1">
                      <MessageSquare className="icon-sm mr-2" />
                      {activity.metadata?.stats?.comments || 0}
                    </Button>

                    <Button variant="ghost" size="sm" className="flex-1">
                      <Share2 className="icon-sm mr-2" />
                      {activity.metadata?.stats?.shares || 0}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {activities.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start connecting with people to see their activity
            </p>
            <Button>Discover People</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
