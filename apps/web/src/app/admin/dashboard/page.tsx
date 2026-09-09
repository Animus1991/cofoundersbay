'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import {
  Users,
  MessageSquare,
  Calendar,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Shield,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const UserRoleChart = dynamic(
  () => import('./Charts').then((m) => ({ default: m.UserRoleChart })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-secondary/40 rounded-lg" /> },
);
const EngagementChart = dynamic(
  () => import('./Charts').then((m) => ({ default: m.EngagementChart })),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse bg-secondary/40 rounded-lg" /> },
);

interface AdminMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    new: number;
    byRole: Record<string, number>;
  };
  engagement: {
    messages: number;
    connections: number;
    events: number;
    groups: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
    cacheHitRate: number;
  };
  business: {
    mentorSessions: number;
    jobPostings: number;
    profileViews: number;
    conversionRate: number;
  };
}

interface SecurityAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

const fetchAdminMetrics = async (): Promise<AdminMetrics> => {
  // Simulate API call - in real implementation, this would call the analytics API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        timestamp: new Date().toISOString(),
        users: {
          total: 1247,
          active: 892,
          new: 47,
          byRole: {
            founder: 523,
            mentor: 312,
            investor: 189,
            org: 223,
          },
        },
        engagement: {
          messages: 3421,
          connections: 156,
          events: 23,
          groups: 45,
        },
        performance: {
          avgResponseTime: 245,
          errorRate: 0.012,
          uptime: 0.998,
          cacheHitRate: 0.87,
        },
        business: {
          mentorSessions: 67,
          jobPostings: 34,
          profileViews: 8923,
          conversionRate: 0.037,
        },
      });
    }, 1000);
  });
};

const fetchSecurityAlerts = async (): Promise<SecurityAlert[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          type: 'warning',
          message: 'High error rate detected on authentication endpoints',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          type: 'info',
          message: 'New user registration spike detected',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: 'error',
          message: 'Database connection timeout in last 5 minutes',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ]);
    }, 800);
  });
};

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['admin-metrics', timeRange],
    queryFn: fetchAdminMetrics,
    refetchInterval: refreshInterval,
  });

  const {
    data: alerts,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: fetchSecurityAlerts,
    refetchInterval: refreshInterval,
  });

  // Prepare chart data
  const userRoleData = metrics?.users.byRole
    ? Object.entries(metrics.users.byRole).map(([role, count]) => ({
        name: role.charAt(0).toUpperCase() + role.slice(1),
        value: count,
      }))
    : [];

  const engagementData = metrics?.engagement
    ? [
        { name: 'Messages', value: metrics.engagement.messages, icon: MessageSquare },
        { name: 'Connections', value: metrics.engagement.connections, icon: Users },
        { name: 'Events', value: metrics.engagement.events, icon: Calendar },
        { name: 'Groups', value: metrics.engagement.groups, icon: Briefcase },
      ]
    : [];

  const performanceData = metrics?.performance
    ? [
        { name: 'Response Time', value: metrics.performance.avgResponseTime, max: 500, unit: 'ms' },
        { name: 'Error Rate', value: metrics.performance.errorRate * 100, max: 5, unit: '%' },
        { name: 'Uptime', value: metrics.performance.uptime * 100, max: 100, unit: '%' },
        { name: 'Cache Hit Rate', value: metrics.performance.cacheHitRate * 100, max: 100, unit: '%' },
      ]
    : [];

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="icon-sm text-red-500" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="icon-sm text-yellow-500" aria-hidden="true" />;
      case 'info':
        return <CheckCircle className="icon-sm text-blue-500" aria-hidden="true" />;
    }
  };

  const getAlertColor = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMins / 1440)} days ago`;
    }
  };

  if (metricsError) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Dashboard Error</h2>
          <p className="text-muted-foreground">Failed to load admin metrics</p>
          <Button onClick={() => refetchMetrics()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your CoFounderBay platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button
            variant="outline"
            onClick={() => {
              refetchMetrics();
              refetchAlerts();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="icon-sm text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {metricsLoading ? '...' : metrics?.users.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.users.new} new today
            </p>
            <div className="mt-2">
              <Progress value={(metrics?.users.active || 0) / (metrics?.users.total || 1) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {((metrics?.users.active || 0) / (metrics?.users.total || 1) * 100).toFixed(1)}% active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="icon-sm text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {metricsLoading ? '...' : (
                Object.values(metrics?.engagement || {}).reduce((a, b) => a + b, 0).toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total interactions
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Messages</span>
                <span>{metrics?.engagement.messages}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Connections</span>
                <span>{metrics?.engagement.connections}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="icon-sm text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {metricsLoading ? '...' : `${metrics?.performance.avgResponseTime}ms`}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg response time
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Uptime</span>
                <span>{((metrics?.performance.uptime || 0) * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Error Rate</span>
                <span>{((metrics?.performance.errorRate || 0) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business</CardTitle>
            <Briefcase className="icon-sm text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {metricsLoading ? '...' : metrics?.business.mentorSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              Mentor sessions
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Job Posts</span>
                <span>{metrics?.business.jobPostings}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Conversion</span>
                <span>{((metrics?.business.conversionRate || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRoleChart data={userRoleData} />
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementChart data={engagementData} />
          </CardContent>
        </Card>
      </div>

      {/* Performance and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{metric.name}</span>
                    <span>{metric.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.max) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="icon-sm" aria-hidden="true" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertsLoading ? (
                <div className="text-center text-muted-foreground py-4">
                  Loading alerts...
                </div>
              ) : alerts?.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No active alerts
                </div>
              ) : (
                alerts?.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="icon-sm" aria-hidden="true" />
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="icon-lg mb-2" aria-hidden="true" />
              <span className="text-sm">User Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Shield className="icon-lg mb-2" aria-hidden="true" />
              <span className="text-sm">Security</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="icon-lg mb-2" aria-hidden="true" />
              <span className="text-sm">Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Briefcase className="icon-lg mb-2" aria-hidden="true" />
              <span className="text-sm">Business</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
