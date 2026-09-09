'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Users,
  Gift,
  Share2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Invite {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  sentAt: string;
  acceptedAt?: string;
}

export function InviteSystem() {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=${localStorage.getItem('user_id') || 'demo'}`
    : '';

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const response = await fetch('/api/v1/invites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      return data.invites || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['invite-stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/invites/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      return response.json();
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/v1/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) throw new Error('Failed to send invite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      queryClient.invalidateQueries({ queryKey: ['invite-stats'] });
      setEmail('');
    },
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      sendInviteMutation.mutate(email);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Gift className="icon-lg text-primary-emphasis" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Invite Friends & Earn Rewards</h2>
              <p className="text-sm text-muted-foreground">
                Get premium features when your friends join
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xl font-bold">{stats?.totalInvites || 0}</p>
              <p className="text-xs text-muted-foreground">Invites Sent</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{stats?.acceptedInvites || 0}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{stats?.rewards || 0}</p>
              <p className="text-xs text-muted-foreground">Rewards Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="email">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">
            <Mail className="icon-sm mr-2" aria-hidden="true" />
            Email Invite
          </TabsTrigger>
          <TabsTrigger value="link">
            <Share2 className="icon-sm mr-2" aria-hidden="true" />
            Share Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Email Invitation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={sendInviteMutation.isPending || !email}
                    >
                      <Send className="icon-sm mr-2" aria-hidden="true" />
                      Send
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sent Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-secondary/40 rounded animate-pulse" />
                  ))}
                </div>
              ) : invites.length > 0 ? (
                <div className="space-y-2">
                  {invites.map((invite: Invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-secondary">
                          <Mail className="icon-sm" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent {new Date(invite.sentAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          invite.status === 'accepted'
                            ? 'default'
                            : invite.status === 'expired'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {invite.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-2 opacity-40" aria-hidden="true" />
                  <p>No invitations sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Share this link with friends</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleCopyLink} variant="outline">
                    {copied ? (
                      <>
                        <Check className="icon-sm mr-2 text-green-500" aria-hidden="true" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="icon-sm mr-2" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/40">
                <h4 className="font-semibold mb-2">How it works:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Share your unique referral link</li>
                  <li>• Friends sign up using your link</li>
                  <li>• You both get premium features</li>
                  <li>• Earn rewards for every successful referral</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
