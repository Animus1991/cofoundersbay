'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  Star,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  priceType: 'fixed' | 'hourly' | 'custom';
  deliveryTime: string;
  isActive: boolean;
  bookings: number;
  rating: number;
  reviews: number;
};

function ServiceCard({ service }: { service: Service }) {
  const [isActive, setIsActive] = useState(service.isActive);

  return (
    <Card className={cn('transition-all', !isActive && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{service.name}</h3>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {service.description}
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                {service.price}
                {service.priceType === 'hourly' && '/hr'}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {service.deliveryTime}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {service.rating} ({service.reviews})
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline">{service.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {service.bookings} bookings
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Service
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProviderServicesPage() {
  const [search, setSearch] = useState('');

  // Mock data
  const services: Service[] = [
    {
      id: '1',
      name: 'Startup Legal Package',
      description: 'Complete legal setup for startups including incorporation, founder agreements, and IP protection.',
      category: 'Legal',
      price: '$2,500',
      priceType: 'fixed',
      deliveryTime: '2 weeks',
      isActive: true,
      bookings: 24,
      rating: 4.9,
      reviews: 18,
    },
    {
      id: '2',
      name: 'Financial Model Creation',
      description: 'Professional financial model for fundraising with 3-5 year projections and scenario analysis.',
      category: 'Finance',
      price: '$1,200',
      priceType: 'fixed',
      deliveryTime: '1 week',
      isActive: true,
      bookings: 15,
      rating: 4.8,
      reviews: 12,
    },
    {
      id: '3',
      name: 'Contract Review',
      description: 'Review and markup of any business contract with legal recommendations.',
      category: 'Legal',
      price: '$150',
      priceType: 'hourly',
      deliveryTime: '48 hours',
      isActive: true,
      bookings: 42,
      rating: 4.7,
      reviews: 35,
    },
    {
      id: '4',
      name: 'Pitch Deck Design',
      description: 'Professional pitch deck design with compelling visuals and storytelling.',
      category: 'Design',
      price: '$800',
      priceType: 'fixed',
      deliveryTime: '5 days',
      isActive: false,
      bookings: 8,
      rating: 4.6,
      reviews: 6,
    },
  ];

  const filteredServices = services.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Services</h1>
            <p className="text-muted-foreground">
              Manage your service offerings
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {services.filter((s) => s.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">
                {services.reduce((acc, s) => acc + s.bookings, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Services List */}
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
          {filteredServices.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No services found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or add a new service
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
