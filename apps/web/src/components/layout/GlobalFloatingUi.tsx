'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const ChatBubble = dynamic(
  () => import('@/components/common/ChatBubble').then((mod) => mod.ChatBubble),
  { ssr: false },
);
const ChatPopup = dynamic(
  () => import('@/components/common/ChatPopup').then((mod) => mod.ChatPopup),
  { ssr: false },
);
const AIAssistant = dynamic(
  () => import('@/components/common/AIAssistant').then((mod) => mod.AIAssistant),
  { ssr: false },
);
const CookieConsent = dynamic(
  () => import('@/components/common/CookieConsent').then((mod) => mod.CookieConsent),
  { ssr: false },
);

const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/onboarding',
];

function matchesHiddenPrefix(pathname: string | null): boolean {
  if (!pathname) return false;

  return HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function GlobalFloatingUi() {
  const pathname = usePathname();

  if (matchesHiddenPrefix(pathname)) {
    return null;
  }

  return (
    <>
      <ChatBubble />
      <ChatPopup />
      <AIAssistant />
      <CookieConsent />
    </>
  );
}
