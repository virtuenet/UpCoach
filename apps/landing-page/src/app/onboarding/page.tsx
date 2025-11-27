'use client';

import { Button, Card, Input, Label, Progress, Textarea } from '@upcoach/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Target,
  Calendar,
  Brain,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { trackEvent } from '@/services/analytics';
import api from '@/services/api';

interface OnboardingData {
  profile: {
    name: string;
    age?: number;
    occupation?: string;
    timezone?: string;
  };
  goals: {
    primaryGoal: string;
    specificGoals: string[];
    timeline: string;
  };
  preferences: {
    coachingStyle: string;
    sessionFrequency: string;
    focusAreas: string[];
    challenges: string;
  };
  availability: {
    preferredDays: string[];
    preferredTimes: string[];
    commitmentLevel: string;
  };
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'goals', title: 'Your Goals', icon: Target },
  { id: 'preferences', title: 'Preferences', icon: Brain },
  { id: 'availability', title: 'Availability', icon: Calendar },
  { id: 'complete', title: 'All Set!', icon: Check },
];

const goalOptions = [
  'Career Growth',
  'Personal Development',
  'Health & Wellness',
  'Relationship Building',
  'Financial Success',
  'Work-Life Balance',
  'Leadership Skills',
  'Stress Management',
];

const coachingStyles = [
  {
    value: 'supportive',
    label: 'Supportive & Encouraging',
    description: 'Gentle guidance with positive reinforcement',
  },
  {
    value: 'challenging',
    label: 'Direct & Challenging',
    description: 'Push boundaries and challenge comfort zones',
  },
  {
    value: 'analytical',
    label: 'Analytical & Strategic',
    description: 'Data-driven approach with clear strategies',
  },
  {
    value: 'holistic',
    label: 'Holistic & Balanced',
    description: 'Consider all aspects of life and well-being',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    profile: { name: '' },
    goals: { primaryGoal: '', specificGoals: [], timeline: '' },
    preferences: {
      coachingStyle: '',
      sessionFrequency: '',
      focusAreas: [],
      challenges: '',
    },
    availability: {
      preferredDays: [],
      preferredTimes: [],
      commitmentLevel: '',
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackEvent('Onboarding Started', { step: steps[currentStep].id });
  }, []);

  const updateData = (section: keyof OnboardingData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      trackEvent('Onboarding Step Completed', {
        step: steps[currentStep].id,
        nextStep: steps[currentStep + 1].id,
      });
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await api.post('/users/onboarding', data);
      trackEvent('Onboarding Completed', {
        goals: data.goals.specificGoals.length,
        coachingStyle: data.preferences.coachingStyle,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    index < currentStep
                      ? 'bg-primary border-primary text-white'
                      : index === currentStep
                        ? 'border-primary'
                        : 'border-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
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
          >
            <Card className="p-8">
              {/* Welcome Step */}
              {currentStep === 0 && (
                <div className="text-center space-y-6">
                  <Sparkles className="h-16 w-16 text-primary mx-auto" />
                  <h1 className="text-3xl font-bold">Welcome to UpCoach!</h1>
                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    Let's personalize your coaching experience. This will take about 5 minutes.
                  </p>
                  <div className="space-y-4 text-left max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">Personalized AI Coach</p>
                        <p className="text-sm text-gray-600">
                          We'll match you with an AI coach tailored to your needs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">Custom Action Plans</p>
                        <p className="text-sm text-gray-600">
                          Get specific steps to achieve your goals
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">24/7 Support</p>
                        <p className="text-sm text-gray-600">
                          Your AI coach is always available when you need guidance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Step */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
                    <p className="text-gray-600">
                      This helps us personalize your coaching experience
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={data.profile.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('profile', 'name', e.target.value)}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age (optional)</Label>
                      <Input
                        id="age"
                        type="number"
                        value={data.profile.age?.toString() || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('profile', 'age', parseInt(e.target.value))}
                        placeholder="25"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="occupation">Occupation (optional)</Label>
                      <Input
                        id="occupation"
                        value={data.profile.occupation || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('profile', 'occupation', e.target.value)}
                        placeholder="Software Engineer"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Goals Step */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">What are your goals?</h2>
                    <p className="text-gray-600">
                      Select your primary focus area and specific goals
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Primary Goal Area</Label>
                      <div className="mt-2 space-y-2">
                        {goalOptions.map(goal => (
                          <div key={goal} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="primaryGoal"
                              value={goal}
                              checked={data.goals.primaryGoal === goal}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('goals', 'primaryGoal', e.target.value)}
                              className="h-4 w-4"
                            />
                            <Label className="cursor-pointer">
                              {goal}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="specific-goals">Specific Goals</Label>
                      <Textarea
                        id="specific-goals"
                        placeholder="e.g., Get promoted to senior position, improve work-life balance, develop leadership skills..."
                        value={data.goals.specificGoals.join('\n')}
                        onChange={e =>
                          updateData(
                            'goals',
                            'specificGoals',
                            e.target.value.split('\n').filter(g => g)
                          )
                        }
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Timeline</Label>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        {['1-3 months', '3-6 months', '6-12 months', '1+ years'].map(time => (
                          <div key={time} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="timeline"
                              value={time}
                              checked={data.goals.timeline === time}
                              onChange={(e) => updateData('goals', 'timeline', e.target.value)}
                              className="h-4 w-4"
                            />
                            <Label className="cursor-pointer">
                              {time}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Step */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your coaching preferences</h2>
                    <p className="text-gray-600">Help us understand how you'd like to be coached</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Preferred Coaching Style</Label>
                      <div className="mt-2 space-y-3">
                        {coachingStyles.map(style => (
                          <div
                            key={style.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              data.preferences.coachingStyle === style.value
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              <input
                                type="radio"
                                name="coachingStyle"
                                value={style.value}
                                checked={data.preferences.coachingStyle === style.value}
                                onChange={(e) => updateData('preferences', 'coachingStyle', e.target.value)}
                                className="h-4 w-4 mt-1"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={style.value}
                                  className="cursor-pointer font-semibold"
                                >
                                  {style.label}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">{style.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="challenges">Current Challenges</Label>
                      <Textarea
                        id="challenges"
                        placeholder="What obstacles are you facing in achieving your goals?"
                        value={data.preferences.challenges}
                        onChange={e => updateData('preferences', 'challenges', e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Step */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Your availability</h2>
                    <p className="text-gray-600">
                      When would you like to engage with your AI coach?
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Preferred Days</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          'Monday',
                          'Tuesday',
                          'Wednesday',
                          'Thursday',
                          'Friday',
                          'Saturday',
                          'Sunday',
                        ].map(day => (
                          <label key={day} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.availability.preferredDays.includes(day)}
                              onChange={e => {
                                const days = e.target.checked
                                  ? [...data.availability.preferredDays, day]
                                  : data.availability.preferredDays.filter(d => d !== day);
                                updateData('availability', 'preferredDays', days);
                              }}
                              className="rounded"
                            />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Commitment Level</Label>
                      <div className="mt-2">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="radio" name="commitmentLevel" value="daily" checked={data.availability.commitmentLevel === 'daily'} onChange={(e) => updateData('availability', 'commitmentLevel', e.target.value)} className="h-4 w-4" />
                            <Label htmlFor="daily" className="cursor-pointer">
                              Daily (10-15 minutes per day)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" name="commitmentLevel" value="regular" checked={data.availability.commitmentLevel === 'regular'} onChange={(e) => updateData('availability', 'commitmentLevel', e.target.value)} className="h-4 w-4" />
                            <Label htmlFor="regular" className="cursor-pointer">
                              Regular (3-4 times per week)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="radio" name="commitmentLevel" value="weekly" checked={data.availability.commitmentLevel === 'weekly'} onChange={(e) => updateData('availability', 'commitmentLevel', e.target.value)} className="h-4 w-4" />
                            <Label htmlFor="weekly" className="cursor-pointer">
                              Weekly (1-2 times per week)
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Step */}
              {currentStep === 5 && (
                <div className="text-center space-y-6">
                  <Check className="h-16 w-16 text-green-600 mx-auto" />
                  <h1 className="text-3xl font-bold">You're all set!</h1>
                  <p className="text-lg text-gray-600 max-w-md mx-auto">
                    Your personalized AI coach is ready. Let's start your journey to success!
                  </p>
                  <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                    <h3 className="font-semibold mb-3">What happens next?</h3>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                        <span>Your AI coach will create a personalized action plan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                        <span>You'll receive daily check-ins and motivation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                        <span>Track your progress with insights and analytics</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={currentStep === 0 ? 'invisible' : ''}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !data.profile.name) ||
                      (currentStep === 2 && !data.goals.primaryGoal) ||
                      (currentStep === 3 && !data.preferences.coachingStyle) ||
                      (currentStep === 4 && !data.availability.commitmentLevel)
                    }
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={completeOnboarding} disabled={loading} className="min-w-[150px]">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        Start Coaching
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
