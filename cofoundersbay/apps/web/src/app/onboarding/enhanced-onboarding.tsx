'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Circle,
  Sparkles,
  Target,
  Users,
  Lightbulb,
  Rocket,
  Shield,
  Star,
  Zap,
  Globe,
  Briefcase,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { createProfile, uploadAvatar, listSkills } from '@/lib/api';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'welcome', title: 'Welcome to CoFounderBay', icon: Sparkles },
  { id: 'role', title: 'What\'s your role?', icon: Target },
  { id: 'profile', title: 'Build your profile', icon: Users },
  { id: 'skills', title: 'Your expertise', icon: Lightbulb },
  { id: 'preferences', title: 'Preferences', icon: Globe },
  { id: 'review', title: 'Review & Launch', icon: Rocket },
];

const ROLE_DESCRIPTIONS = {
  founder: {
    title: 'Founder',
    description: 'Building the next big thing',
    icon: Rocket,
    color: 'bg-blue-500',
    questions: [
      'What stage is your startup at?',
      'What are you looking for in a co-founder?',
      'What\'s your industry focus?',
    ],
  },
  mentor: {
    title: 'Mentor',
    description: 'Guiding the next generation',
    icon: GraduationCap,
    color: 'bg-green-500',
    questions: [
      'What areas do you specialize in?',
      'What\'s your mentoring style?',
      'How much time can you commit?',
    ],
  },
  investor: {
    title: 'Investor',
    description: 'Fueling innovation and growth',
    icon: Briefcase,
    color: 'bg-purple-500',
    questions: [
      'What\'s your investment focus?',
      'What stages do you invest in?',
      'What\'s your typical check size?',
    ],
  },
  org: {
    title: 'Organization',
    description: 'Supporting the ecosystem',
    icon: Building2,
    color: 'bg-orange-500',
    questions: [
      'What type of organization are you?',
      'What programs do you offer?',
      'How can you help founders?',
    ],
  },
};

const SKILL_CATEGORIES = [
  'Technical',
  'Business',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Legal',
  'Product',
  'Data',
];

const INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'FinTech',
  'HealthTech',
  'EdTech',
  'CleanTech',
  'AI/ML',
  'Blockchain',
  'Gaming',
  'Social',
  'Mobile',
  'IoT',
  'Other',
];

const STAGES = ['Idea', 'MVP', 'Traction', 'Scaling', 'Established'];

interface OnboardingData {
  role: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  timezone: string;
  languages: string[];
  avatarUrl?: string;
  skills: string[];
  rolePayload: Record<string, any>;
  preferences: {
    remote: boolean;
    locationPreference: string;
    commitment: string;
    notificationFrequency: string;
  };
}

export default function EnhancedOnboardingPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    role: '',
    displayName: '',
    headline: '',
    bio: '',
    location: '',
    timezone: '',
    languages: [],
    skills: [],
    rolePayload: {},
    preferences: {
      remote: false,
      locationPreference: '',
      commitment: '',
      notificationFrequency: 'daily',
    },
  });
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => listSkills(),
  });

  const createProfileMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      success('Profile created successfully!', 'Welcome to CoFounderBay');
      router.push('/dashboard');
    },
    onError: (err: any) => {
      showError('Failed to create profile', err.message || 'Please try again');
    },
  });

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleRoleSelect = (role: string) => {
    setData(prev => ({ ...prev, role }));
    handleNext();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let avatarUrl = data.avatarUrl;
      
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        avatarUrl = uploadResult.upload.url;
      }

      await createProfileMutation.mutateAsync({
        displayName: data.displayName,
        headline: data.headline,
        bio: data.bio,
        location: data.location,
        timezone: data.timezone,
        languages: data.languages,
        avatarUrl,
        rolePayload: data.rolePayload,
        skillIds: data.skills,
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} />;
      case 'role':
        return <RoleStep selectedRole={data.role} onSelect={handleRoleSelect} />;
      case 'profile':
        return (
          <ProfileStep
            data={data}
            setData={setData}
            avatarPreview={avatarPreview}
            onAvatarChange={handleAvatarChange}
          />
        );
      case 'skills':
        return (
          <SkillsStep
            selectedSkills={data.skills}
            onSkillToggle={handleSkillToggle}
            skillsData={skillsData}
          />
        );
      case 'preferences':
        return <PreferencesStep data={data} setData={setData} />;
      case 'review':
        return (
          <ReviewStep
            data={data}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CoFounderBay Onboarding</h1>
                <p className="text-muted-foreground">Let's build your profile together</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              {currentStep + 1} of {STEPS.length}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              className="gap-2"
              disabled={
                (STEPS[currentStep].id === 'role' && !data.role) ||
                (STEPS[currentStep].id === 'profile' && (!data.displayName || !data.bio))
              }
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !data.displayName || !data.bio}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Launch Profile
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <Sparkles className="h-8 w-8 text-primary" />
          Welcome to CoFounderBay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg text-muted-foreground">
          The premier platform connecting founders, mentors, and investors
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
            <Users className="h-8 w-8 text-blue-600 mb-2 mx-auto" />
            <h3 className="font-semibold mb-1">Smart Matching</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered connections based on skills and goals
            </p>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
            <Shield className="h-8 w-8 text-green-600 mb-2 mx-auto" />
            <h3 className="font-semibold mb-1">Verified Profiles</h3>
            <p className="text-sm text-muted-foreground">
              Trust and quality through verification system
            </p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
            <Zap className="h-8 w-8 text-purple-600 mb-2 mx-auto" />
            <h3 className="font-semibold mb-1">Real-time Chat</h3>
            <p className="text-sm text-muted-foreground">
              Instant communication with potential partners
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">What you'll get:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Personalized match recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Access to exclusive events</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Mentorship opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Investor connections</span>
            </div>
          </div>
        </div>

        <Button onClick={onNext} size="lg" className="w-full gap-2">
          Let's Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function RoleStep({ selectedRole, onSelect }: { selectedRole: string; onSelect: (role: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What's your role in the startup ecosystem?</CardTitle>
        <p className="text-muted-foreground">
          Select the role that best describes you
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ROLE_DESCRIPTIONS).map(([key, role]) => {
            const Icon = role.icon;
            return (
              <div
                key={key}
                onClick={() => onSelect(key)}
                className={cn(
                  'p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
                  selectedRole === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn('p-3 rounded-lg', role.color)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileStep({
  data,
  setData,
  avatarPreview,
  onAvatarChange,
}: {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  avatarPreview: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Build your profile</CardTitle>
        <p className="text-muted-foreground">
          Tell us about yourself
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback>
                {data.displayName ? data.displayName[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              <div className="p-1 bg-white rounded-full">
                <div className="w-4 h-4 bg-primary rounded-full" />
              </div>
            </label>
          </div>
          <div>
            <h3 className="font-semibold">Profile Photo</h3>
            <p className="text-sm text-muted-foreground">
              Add a photo to build trust
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name *</label>
            <Input
              value={data.displayName}
              onChange={(e) => setData({ ...data, displayName: e.target.value })}
              placeholder="John Doe"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Headline</label>
            <Input
              value={data.headline}
              onChange={(e) => setData({ ...data, headline: e.target.value })}
              placeholder="Founder at Tech Startup"
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio *</label>
            <Textarea
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
              placeholder="Tell us about your background, experience, and what you're looking for..."
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {data.bio.length}/5000 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <Select value={data.timezone} onValueChange={(value) => setData({ ...data, timezone: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillsStep({
  selectedSkills,
  onSkillToggle,
  skillsData,
}: {
  selectedSkills: string[];
  onSkillToggle: (skillId: string) => void;
  skillsData?: any;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredSkills = skillsData?.filter((skill: any) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your expertise</CardTitle>
        <p className="text-muted-foreground">
          Select your skills and expertise areas
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="space-y-4">
          <Input
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-3 py-1 rounded-full text-sm',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              All
            </button>
            {SKILL_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Selected Skills ({selectedSkills.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map(skillId => {
                const skill = skillsData?.find((s: any) => s.id === skillId);
                return (
                  <Badge
                    key={skillId}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => onSkillToggle(skillId)}
                  >
                    {skill?.name}
                    <button className="ml-1 text-xs">×</button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Skills */}
        <div>
          <h3 className="font-semibold mb-2">Available Skills</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filteredSkills.map((skill: any) => (
              <button
                key={skill.id}
                onClick={() => onSkillToggle(skill.id)}
                className={cn(
                  'p-2 text-left rounded border transition-colors',
                  selectedSkills.includes(skill.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium text-sm">{skill.name}</div>
                <div className="text-xs text-muted-foreground">{skill.category}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesStep({ data, setData }: { data: OnboardingData; setData: (data: OnboardingData) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <p className="text-muted-foreground">
          Set your collaboration preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Remote Work */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Open to Remote Work</h3>
            <p className="text-sm text-muted-foreground">
              Work with people from anywhere
            </p>
          </div>
          <Checkbox
            checked={data.preferences.remote}
            onCheckedChange={(checked: boolean | 'indeterminate') =>
              setData({
                ...data,
                preferences: { ...data.preferences, remote: checked as boolean },
              })
            }
          />
        </div>

        {/* Commitment Level */}
        <div>
          <label className="block text-sm font-medium mb-2">Commitment Level</label>
          <Select
            value={data.preferences.commitment}
            onValueChange={(value) =>
              setData({
                ...data,
                preferences: { ...data.preferences, commitment: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select commitment level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
              <SelectItem value="advisor">Advisor only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification Frequency */}
        <div>
          <label className="block text-sm font-medium mb-2">Notification Frequency</label>
          <Select
            value={data.preferences.notificationFrequency}
            onValueChange={(value) =>
              setData({
                ...data,
                preferences: { ...data.preferences, notificationFrequency: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select notification frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real-time">Real-time</SelectItem>
              <SelectItem value="daily">Daily digest</SelectItem>
              <SelectItem value="weekly">Weekly digest</SelectItem>
              <SelectItem value="important">Important only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  data,
  onSubmit,
  loading,
}: {
  data: OnboardingData;
  onSubmit: () => void;
  loading: boolean;
}) {
  const selectedRole = ROLE_DESCRIPTIONS[data.role as keyof typeof ROLE_DESCRIPTIONS];
  const RoleIcon = selectedRole?.icon || Target;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          Review & Launch
        </CardTitle>
        <p className="text-muted-foreground">
          Review your profile before going live
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Summary */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-lg', selectedRole?.color)}>
              <RoleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{data.displayName}</h3>
              <p className="text-muted-foreground">{selectedRole?.title}</p>
            </div>
          </div>

          {data.headline && (
            <div>
              <h4 className="font-medium mb-1">Headline</h4>
              <p className="text-sm text-muted-foreground">{data.headline}</p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-1">Bio</h4>
            <p className="text-sm text-muted-foreground">{data.bio}</p>
          </div>

          {(data.location || data.timezone) && (
            <div className="grid grid-cols-2 gap-4">
              {data.location && (
                <div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <p className="text-sm text-muted-foreground">{data.location}</p>
                </div>
              )}
              {data.timezone && (
                <div>
                  <h4 className="font-medium mb-1">Timezone</h4>
                  <p className="text-sm text-muted-foreground">{data.timezone}</p>
                </div>
              )}
            </div>
          )}

          {data.skills.length > 0 && (
            <div>
              <h4 className="font-medium mb-1">Skills ({data.skills.length})</h4>
              <div className="flex flex-wrap gap-1">
                {data.skills.slice(0, 10).map(skillId => (
                  <Badge key={skillId} variant="secondary" className="text-xs">
                    {skillId}
                  </Badge>
                ))}
                {data.skills.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{data.skills.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preferences Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Preferences</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Remote work:</span>
              <span>{data.preferences.remote ? 'Open' : 'Not preferred'}</span>
            </div>
            <div className="flex justify-between">
              <span>Commitment:</span>
              <span>{data.preferences.commitment || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>Notifications:</span>
              <span>{data.preferences.notificationFrequency}</span>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <Button onClick={onSubmit} disabled={loading} size="lg" className="w-full gap-2">
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating Profile...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Launch Profile
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By launching your profile, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  );
}
