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
import { BilingualText } from '@/components/common/BilingualText';
import { RowHead } from '@/components/dashboard/SectionCard';

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
        {/* One row on the card's axis, like every row in a settings card:
            the mark carries the state, the button sits at the right and
            drops under the line on a phone. */}
        <RowHead
          mark={
            <div data-card-mark="" className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-success-bg text-status-success">
              <ShieldCheck className="icon-md" aria-hidden="true" />
            </div>
          }
          title={<BilingualText en="Two-factor authentication is enabled" el="Ο έλεγχος δύο παραγόντων είναι ενεργός" wrap />}
          subtitle={<BilingualText en="Your account is protected with an additional layer of security." el="Ο λογαριασμός σας έχει ένα επιπλέον επίπεδο ασφάλειας." wrap />}
          aside={
            <Button variant="outline" size="sm" onClick={() => setShowDisable(true)}>
              <ShieldOff className="mr-2 icon-sm" />
              <BilingualText en="Disable" el="Απενεργοποίηση" compact />
            </Button>
          }
        />

        <Dialog open={showDisable} onOpenChange={setShowDisable}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle><BilingualText en="Disable Two-Factor Authentication" el="Απενεργοποίηση ελέγχου δύο παραγόντων" wrap /></DialogTitle>
              <DialogDescription>
                <BilingualText en="Enter a verification code from your authenticator app to confirm." el="Εισάγετε κωδικό από την εφαρμογή ελέγχου ταυτότητας για επιβεβαίωση." wrap />
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3 rounded-lg bg-status-warning-bg p-3 text-sm text-status-warning ">
                <AlertTriangle className="icon-md shrink-0" />
                <p>
                  Disabling 2FA will make your account less secure. You&apos;ll only need your
                  password to sign in.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="disable-verification-code" className="text-sm font-medium"><BilingualText en="Verification Code" el="Κωδικός επαλήθευσης" compact /></label>
                <Input
                  id="disable-verification-code"
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
                <BilingualText en="Cancel" el="Ακύρωση" compact />
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
      <RowHead
        mark={
          <div data-card-mark="" className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Shield className="icon-md" aria-hidden="true" />
          </div>
        }
        title={<BilingualText en="Two-factor authentication is disabled" el="Ο έλεγχος δύο παραγόντων είναι ανενεργός" wrap />}
        subtitle="Add an extra layer of security by requiring a verification code from your phone when signing in."
        aside={
          <Button size="sm" onClick={() => setShowSetup(true)}>
            <Shield className="mr-2 icon-sm" />
            <BilingualText en="Enable" el="Ενεργοποίηση" compact />
          </Button>
        }
      />

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle><BilingualText en="Set Up Two-Factor Authentication" el="Ρύθμιση ελέγχου δύο παραγόντων" compact /></DialogTitle>
            <DialogDescription>
              <BilingualText en="Secure your account with an authenticator app like Google Authenticator or Authy." el="Ασφαλίστε τον λογαριασμό σας με εφαρμογή όπως Google Authenticator ή Authy." wrap />
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
