'use client';

import { useState } from 'react';
import { Link2, Twitter, Linkedin, Facebook, Mail, Check, Share2, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  hashtags?: string[];
}

const SHARE_CHANNELS = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    icon: Twitter,
    color: 'hover:bg-[#1da1f2]/10 hover:text-[#1da1f2] hover:border-[#1da1f2]/30',
    getUrl: (url: string, title: string, hashtags: string[]) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}${hashtags.length ? `&hashtags=${hashtags.join(',')}` : ''}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'hover:bg-[#0077b5]/10 hover:text-[#0077b5] hover:border-[#0077b5]/30',
    getUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    color: 'hover:bg-[#1877f2]/10 hover:text-[#1877f2] hover:border-[#1877f2]/30',
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'hover:bg-primary/10 hover:text-primary-accessible hover:border-primary/30',
    getUrl: (url: string, title: string, _: string[], desc: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${desc ? desc + '\n\n' : ''}${url}`)}`,
  },
];

export function ShareModal({
  open,
  onClose,
  url,
  title = 'Check this out',
  description = '',
  imageUrl,
  hashtags = [],
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: description, url });
    } catch {
      // user cancelled
    }
  };

  const openChannel = (channelId: string) => {
    const ch = SHARE_CHANNELS.find((c) => c.id === channelId);
    if (!ch) return;
    const shareUrl = ch.getUrl(url, title, hashtags, description);
    if (channelId === 'email') {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="icon-sm" />
            Share
          </DialogTitle>
          <DialogDescription>
            Copy the link or share this page on your preferred channel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview */}
          {(title || description || imageUrl) && (
            <div className="flex gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
              {imageUrl && (
                <img src={imageUrl} alt="" className="h-14 w-14 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{title}</p>
                {description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{description}</p>}
                <p className="text-xs text-primary-accessible truncate mt-1">{url}</p>
              </div>
            </div>
          )}

          {/* Copy link */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link</p>
            <div className="flex gap-2">
              <Input value={url} readOnly className="text-sm font-mono bg-muted/50 text-xs" />
              <Button
                variant={copied ? 'default' : 'outline'}
                size="sm"
                onClick={handleCopy}
                className={cn('shrink-0 gap-1.5 transition-all', copied && 'bg-green-600 hover:bg-green-600 border-green-600')}
              >
                {copied ? <Check className="icon-sm" /> : <Link2 className="icon-sm" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Social channels */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Share via</p>
            <div className="grid grid-cols-2 gap-2">
              {SHARE_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => openChannel(ch.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 text-sm text-muted-foreground transition-colors',
                    ch.color,
                  )}
                >
                  <ch.icon className="h-4 w-4 shrink-0" />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && !!navigator.share && (
            <Button variant="outline" className="w-full gap-2" onClick={handleNativeShare}>
              <ExternalLink className="icon-sm" />
              More options…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Convenience trigger button
interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  hashtags?: string[];
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
}

export function ShareButton({ url, title, description, imageUrl, hashtags, children, className, variant = 'ghost', size = 'sm' }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children ?? <><Share2 className="icon-sm mr-1.5" />Share</>}
      </Button>
      <ShareModal open={open} onClose={() => setOpen(false)} url={url} title={title} description={description} imageUrl={imageUrl} hashtags={hashtags} />
    </>
  );
}
