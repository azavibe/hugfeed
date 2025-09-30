
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Progress } from '../ui/progress';
import { Loader2, Zap, Brain, Coffee, Wind, Dumbbell } from 'lucide-react';
import { assessMood, MoodAssessmentInput } from '@/ai/flows/mood-assessment-flow';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '@/lib/utils';


const totalSteps = 5;

const wellnessActivities = [
  { id: 'meditation', label: 'Meditation', icon: Coffee },
  { id: 'journaling', label: 'Journaling', icon: Brain },
  { id: 'walking', label: 'Walking', icon: Wind },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { updateUserProfile, userProfile } = useAppContext();

  const [formData, setFormData] = useState({
    name: '',
    pronouns: '',
    goals: '',
    causes: '',
    feelings: '',
    sleep: '',
    happiness: '',
    wellnessActivities: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
        if (userProfile) {
            updateUserProfile({
                ...userProfile,
                name: formData.name || userProfile.name,
                goals: [formData.goals],
                pronouns: formData.pronouns,
                preferredActivities: formData.wellnessActivities,
            });
        }
        
        const assessmentInput: MoodAssessmentInput = {
            goals: formData.goals,
            causes: formData.causes,
            feelings: formData.feelings,
            sleep: formData.sleep,
            happiness: formData.happiness,
        };
        const result = await assessMood(assessmentInput);
        console.log('AI Assessment:', result.summary);
        toast({
            title: "Plan Prepared!",
            description: "Your personalized wellness plan is ready.",
        });
        router.push('/dashboard');
    } catch (error) {
        console.error("Failed to assess mood", error);
        toast({
            title: "Error",
            description: "Could not prepare your plan. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <Card>
      <CardHeader>
        <Progress value={progress} className="mb-4" />
        {step === 1 && <CardTitle className="font-headline text-2xl sm:text-3xl">About You</CardTitle>}
        {step === 2 && <CardTitle className="font-headline text-2xl sm:text-3xl">Your Goals</CardTitle>}
        {step === 3 && <CardTitle className="font-headline text-2xl sm:text-3xl">Wellness Preferences</CardTitle>}
        {step === 4 && <CardTitle className="font-headline text-2xl sm:text-3xl">How are you feeling?</CardTitle>}
        {step === 5 && <CardTitle className="font-headline text-2xl sm:text-3xl">Let's check in</CardTitle>}
        <CardDescription>This helps us tailor your experience.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[250px] sm:min-h-[280px]">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="What should we call you?" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pronouns">Pronouns (optional)</Label>
              <Input id="pronouns" name="pronouns" value={formData.pronouns} onChange={handleChange} placeholder="e.g., she/her, he/him, they/them" />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
             <div className="grid gap-2">
              <Label>What are your main goals for using Hugfeed?</Label>
              <RadioGroup name="goals" onValueChange={(v) => handleRadioChange('goals', v)} value={formData.goals} className="space-y-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="manage-stress" id="g1" /><Label htmlFor="g1">Manage stress & anxiety</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="self-reflection" id="g2" /><Label htmlFor="g2">Practice self-reflection</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="improve-mood" id="g3" /><Label htmlFor="g3">Improve my mood</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="be-present" id="g4" /><Label htmlFor="g4">Be more present</Label></div>
              </RadioGroup>
            </div>
          </div>
        )}
        {step === 3 && (
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label>Which wellness activities do you prefer?</Label>
                    <ToggleGroup 
                        type="multiple"
                        variant="outline" 
                        className="grid grid-cols-2 gap-4"
                        value={formData.wellnessActivities}
                        onValueChange={(value) => setFormData(prev => ({...prev, wellnessActivities: value}))}
                    >
                        {wellnessActivities.map(activity => (
                            <ToggleGroupItem key={activity.id} value={activity.id} className="flex flex-col h-24 gap-2">
                                <activity.icon className="w-8 h-8" />
                                <span>{activity.label}</span>
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </div>
        )}
         {step === 4 && (
          <div className="space-y-4">
             <div className="grid gap-2">
              <Label>What's contributing to how you feel today?</Label>
              <RadioGroup name="causes" onValueChange={(v) => handleRadioChange('causes', v)} value={formData.causes} className="space-y-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="work" id="c1" /><Label htmlFor="c1">Work or school</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="relationships" id="c2" /><Label htmlFor="c2">Relationships</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="health" id="c3" /><Label htmlFor="c3">Health and wellness</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="c4" /><Label htmlFor="c4">Other / Not sure</Label></div>
              </RadioGroup>
            </div>
          </div>
        )}
        {step === 5 && (
             <div className="space-y-6">
                <div className="grid gap-2">
                    <Label>How was your sleep last night?</Label>
                    <RadioGroup name="sleep" onValueChange={(v) => handleRadioChange('sleep', v)} value={formData.sleep} className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="great" id="s1" /><Label htmlFor="s1">Great</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="ok" id="s2" /><Label htmlFor="s2">Okay</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="poor" id="s3" /><Label htmlFor="s3">Poor</Label></div>
                    </RadioGroup>
                </div>
                 <div className="grid gap-2">
                    <Label>Overall, how happy are you feeling right now?</Label>
                    <RadioGroup name="happiness" onValueChange={(v) => handleRadioChange('happiness', v)} value={formData.happiness} className="flex flex-wrap gap-4">
                         <div className="flex items-center space-x-2"><RadioGroupItem value="very-happy" id="h1" /><Label htmlFor="h1">Very Happy</Label></div>
                         <div className="flex items-center space-x-2"><RadioGroupItem value="happy" id="h2" /><Label htmlFor="h2">Happy</Label></div>
                         <div className="flex items-center space-x-2"><RadioGroupItem value="neutral" id="h3" /><Label htmlFor="h3">Neutral</Label></div>
                         <div className="flex items-center space-x-2"><RadioGroupItem value="unhappy" id="h4" /><Label htmlFor="h4">Unhappy</Label></div>
                    </RadioGroup>
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 1 || isProcessing}>
          Back
        </Button>
        {step < totalSteps && (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
        {step === totalSteps && (
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Prepare My Plan
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
