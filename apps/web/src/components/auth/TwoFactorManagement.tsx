'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { disableTwoFactor, getTwoFactorStatus } from '@/lib/api';
import { Shield, ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react';
import { TwoFactorSetup } from './TwoFactorSetup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TwoFactorManagementProps {
  isEnabled: boolean;
  onStatusChange?: (enabled: boolean) => void;
}

export function TwoFactorManagement({ isEnabled, onStatusChange }: TwoFactorManagementProps) {
  const { success, error: showError } = useToast();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleDisable() {
    if (disableCode.length !== 6) {
      showError('Invalid Code', 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await disableTwoFactor(disableCode);
      success('2FA Disabled', 'Two-factor authentication has been disabled');
      onStatusChange?.(false);
      setShowDisable(false);
      setDisableCode('');
    } catch (err) {
      showError('Failed', err instanceof Error ? err.message : 'Could not disable 2FA');
    } finally {
      setIsLoading(false);
    }
  }

  if (isEnabled) {
    return (
      <>
        <div className="flex items-start gap-4 rounded-lg border border-status-success-border bg-status-success-bg p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg">
            <ShieldCheck className="h-5 w-5 text-status-success " />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-status-success ">
              Two-factor authentication is enabled
            </h4>
            <p className="mt-1 text-sm text-status-success ">
              Your account is protected with an additional layer of security.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDisable(true)}
            className="shrink-0"
          >
            <ShieldOff className="mr-2 h-4 w-4" />
            Disable
          </Button>
        </div>

        <Dialog open={showDisable} onOpenChange={setShowDisable}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Enter a verification code from your authenticator app to confirm.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 rounded-lg bg-status-warning-bg p-3 text-sm text-status-warning ">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>
                  Disabling 2FA will make your account less secure. You&apos;ll only need your
                  password to sign in.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDisable(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isLoading || disableCode.length !== 6}
              >
                {isLoading ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex items-start gap-4 rounded-lg border p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Two-factor authentication is disabled</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Add an extra layer of security by requiring a verification code from your phone
            when signing in.
          </p>
        </div>
        <Button onClick={() => setShowSetup(true)} className="shrink-0">
          <Shield className="mr-2 h-4 w-4" />
          Enable
        </Button>
      </div>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Secure your account with an authenticator app like Google Authenticator or Authy.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <TwoFactorSetup
              onEnabled={() => {
                onStatusChange?.(true);
                setShowSetup(false);
              }}
              onCancel={() => setShowSetup(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
