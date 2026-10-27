'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardHead } from '@/components/common/CardAnatomy';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { STATUS } from '@/lib/semantic-colors';
import { BilingualText } from '@/components/common/BilingualText';
import { MainLandmark } from '@/components/layout/AppShell';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface EndpointStatus {
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
  responseTime?: number;
}

export default function ApiStatusPage() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { endpoint: `${API_BASE}/api/health`, status: 'loading' },
    { endpoint: `${API_BASE}/api/health/readiness`, status: 'loading' },
    { endpoint: `${API_BASE}/api/health/liveness`, status: 'loading' },
    { endpoint: `${API_BASE}/api/auth/register`, status: 'loading' },
    { endpoint: `${API_BASE}/api/auth/login`, status: 'loading' },
    { endpoint: `${API_BASE}/api/analytics/achievements`, status: 'loading' },
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkEndpoint = async (endpoint: string): Promise<EndpointStatus> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method: endpoint.includes('register') || endpoint.includes('login') ? 'POST' : 'GET',
        headers: endpoint.includes('register') || endpoint.includes('login') 
          ? { 'Content-Type': 'application/json' }
          : {},
        body: (endpoint.includes('register') || endpoint.includes('login')) 
          ? JSON.stringify({ email: 'test@example.com', password: 'test123' })
          : undefined,
      });

      const responseTime = Date.now() - startTime;

      if (response.ok || response.status === 400 || response.status === 401) {
        // 400/401 are expected for auth endpoints without proper data/tokens
        return {
          endpoint,
          status: 'success',
          responseTime,
        };
      } else {
        return {
          endpoint,
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
        };
      }
    } catch (error) {
      return {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      };
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    
    const updatedEndpoints = await Promise.all(
      endpoints.map(async (endpoint) => {
        const result = await checkEndpoint(endpoint.endpoint);
        return result;
      })
    );

    setEndpoints(updatedEndpoints);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllEndpoints();
  }, []);

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="icon-sm text-status-success" />;
      case 'error':
        return <XCircle className="icon-sm text-status-danger" />;
      case 'loading':
        return <RefreshCw className="icon-sm text-status-info animate-spin" />;
    }
  };

  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className={STATUS.success.chip}><BilingualText en="Working" el="Λειτουργεί" compact /></Badge>;
      case 'error':
        return <Badge variant="destructive"><BilingualText en="Error" el="Σφάλμα" compact /></Badge>;
      case 'loading':
        return <Badge variant="secondary"><BilingualText en="Checking..." el="Έλεγχος…" compact /></Badge>;
    }
  };

  return (
    <MainLandmark className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2"><BilingualText en="API Status Check" el="Έλεγχος κατάστασης API" compact /></h1>
        <p className="text-sm text-muted-foreground">
          <BilingualText en="Check the status of all API endpoints to diagnose 404 errors" el="Ελέγξτε όλα τα endpoints του API για διάγνωση σφαλμάτων 404" wrap />
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={checkAllEndpoints} disabled={isChecking} className="gap-2">
          <RefreshCw className={`icon-sm ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking
            ? <BilingualText en="Checking…" el="Έλεγχος…" compact />
            : <BilingualText en="Check all endpoints" el="Έλεγχος όλων των endpoints" compact />}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {endpoints.map((endpoint, index) => (
          <Card key={index}>
            <CardContent className="space-y-3">
              <CardHead
                mark={
                  <div data-card-mark="" className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    {getStatusIcon(endpoint.status)}
                  </div>
                }
                title={endpoint.endpoint}
                titleClassName="break-all"
                aside={
                  <>
                    {getStatusBadge(endpoint.status)}
                    {endpoint.responseTime ? <span className="tabular-nums">{endpoint.responseTime}ms</span> : null}
                  </>
                }
              />
              {endpoint.error && (
                <p className="flex items-center gap-2 text-xs text-status-danger">
                  <AlertCircle className="icon-sm shrink-0" aria-hidden="true" />
                  <code className="break-all">{endpoint.error}</code>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle><BilingualText en="Troubleshooting Tips" el="Συμβουλές αντιμετώπισης" compact /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              {/* The size sits on the inner span: a phone sets an in-card
                  text-sm line under the card's title, and a heading is not
                  in that rule. */}
              <h4 className="mb-2 font-semibold"><span className="text-sm"><BilingualText en="If endpoints return 404:" el="Αν τα endpoints επιστρέφουν 404:" compact /></span></h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Check if the API server is running on port 3001</li>
                <li><BilingualText en="Verify the API base URL in your environment variables" el="Ελέγξτε το βασικό URL του API στις μεταβλητές περιβάλλοντος" wrap /></li>
                <li><BilingualText en="Ensure the modules are properly registered in app.module.ts" el="Βεβαιωθείτε ότι τα modules είναι δηλωμένα στο app.module.ts" wrap /></li>
                <li><BilingualText en="Check for any TypeScript compilation errors" el="Ελέγξτε για σφάλματα μεταγλώττισης TypeScript" wrap /></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-2 font-semibold"><span className="text-sm"><BilingualText en="Common solutions:" el="Συνήθεις λύσεις:" compact /></span></h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Restart the API server: <code>npm run start:dev</code></li>
                <li><BilingualText en="Check the API logs for any errors" el="Ελέγξτε τα logs του API για σφάλματα" wrap /></li>
                <li><BilingualText en="Verify database connection" el="Ελέγξτε τη σύνδεση με τη βάση δεδομένων" compact /></li>
                <li>Clear Next.js cache: <code>rm -rf .next</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLandmark>
  );
}
