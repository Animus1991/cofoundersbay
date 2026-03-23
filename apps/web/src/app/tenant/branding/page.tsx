'use client';

import { useState } from 'react';
import {
  Lightbulb,
  Upload,
  Palette,
  Type,
  Image,
  Save,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function TenantBrandingPage() {
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [accentColor, setAccentColor] = useState('#22d3ee');

  return (
    <AppShell>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Branding</h1>
            <p className="text-muted-foreground">
              Customize your organization's appearance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Identity</CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" defaultValue="TechHub Accelerator" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" defaultValue="Empowering the next generation of founders" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    defaultValue="TechHub Accelerator is a leading startup accelerator focused on early-stage tech companies."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Use your own domain for a white-label experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input id="domain" placeholder="portal.yourdomain.com" />
                  <p className="text-xs text-muted-foreground">
                    Point your domain's CNAME record to portal.cofounderbay.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>
                  Define your organization's color palette
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-10 rounded-lg border cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-10 rounded-lg border cursor-pointer"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-10 rounded-lg border cursor-pointer"
                        style={{ backgroundColor: accentColor }}
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-3">Preview</p>
                  <div className="flex gap-2">
                    <Button style={{ backgroundColor: primaryColor }}>Primary Button</Button>
                    <Button variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                      Secondary
                    </Button>
                    <Button variant="ghost" style={{ color: accentColor }}>Accent Link</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>
                  Customize fonts for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Input defaultValue="Inter" />
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Input defaultValue="Inter" />
                </div>
                <div className="p-4 rounded-lg border mt-4">
                  <p className="text-sm font-medium mb-3">Preview</p>
                  <h2 className="text-2xl font-bold mb-2">Heading Example</h2>
                  <p className="text-muted-foreground">
                    This is body text that demonstrates how your typography choices will appear across the platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets */}
          <TabsContent value="assets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>
                  Upload your organization's logo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Logo</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drop your logo here or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, SVG up to 2MB
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo (Dark Mode)</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-gray-900">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">
                        Drop your logo here or click to upload
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, SVG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>
                  The icon that appears in browser tabs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Favicon
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>
                  Background image for login and landing pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop your cover image here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended: 1920x1080px, PNG or JPG
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
