import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const SKILLS_OPTIONS = [
  "Developer",
  "Designer",
  "Marketer",
  "Business Development",
  "Sales",
  "Product",
];
const INDUSTRIES_OPTIONS = [
  "Finance/ Fintech",
  "Retail",
  "E-Commerce",
  "Construction/ Trade",
  "Agency - digital (eg, marketing, Web design)",
  "Agency - other (eg real estate, recruitment)",
  "Consulting",
  "Manufacturing",
  "Wholesale",
  "Web or Mobile app",
  "Website (eg news, affiliate)",
  "Other",
];
const LOOKING_FOR_OPTIONS = [
  "Technical Co-Founder",
  "Business Co-Founder",
  "Marketing Co-Founder",
  "Product Co-Founder",
  "CTO",
  "CEO",
  "CMO",
];
const WORK_STYLE_OPTIONS = [
  "Collaborative",
  "Independent",
  "Analytical",
  "Creative",
  "Strategic",
  "Hands-on",
];
const VALUES_OPTIONS = [
  "Innovation",
  "Customer-first",
  "Sustainability",
  "Growth",
  "Quality",
  "Speed",
  "Transparency",
];

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    location: "",
    skills: [] as string[],
    experience: "",
    industries: [] as string[],
    lookingFor: [] as string[],
    targetIndustries: [] as string[],
    workStyle: [] as string[],
    values: [] as string[],
    commitment: "",
  });

  const createProfile = trpc.profile.create.useMutation({
    onSuccess: () => {
      toast.success("Profile created successfully!");
      setLocation("/dashboard");
    },
    onError: error => {
      toast.error("Failed to create profile: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">
            Please sign in to continue
          </h2>
          <p className="text-muted-foreground">
            You need to be signed in to complete your profile.
          </p>
        </Card>
      </div>
    );
  }

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  const handleSubmit = () => {
    const completeness = Math.round(
      (((formData.location ? 1 : 0) +
        (formData.skills.length > 0 ? 1 : 0) +
        (formData.experience ? 1 : 0) +
        (formData.industries.length > 0 ? 1 : 0) +
        (formData.lookingFor.length > 0 ? 1 : 0) +
        (formData.targetIndustries.length > 0 ? 1 : 0) +
        (formData.workStyle.length > 0 ? 1 : 0) +
        (formData.values.length > 0 ? 1 : 0)) /
        8) *
        100
    );

    createProfile.mutate({
      ...formData,
      completeness,
      isPublic: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 py-12">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Let's Find Your Perfect Match
            </h1>
          </div>
          <p className="text-muted-foreground">
            Tell us about yourself so we can find the best co-founders for you
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s < step
                    ? "bg-green-500"
                    : s === step
                      ? "bg-orange-500"
                      : "bg-muted"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${s < step ? "bg-green-500" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <Card className="p-8 bg-card/50 backdrop-blur border-white/10">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Basic Information</h3>
                <p className="text-muted-foreground">
                  Where are you based and what's your experience level?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={e =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Experience Level</Label>
                  <select
                    id="experience"
                    className="w-full px-3 py-2 bg-input border border-border rounded-md"
                    value={formData.experience}
                    onChange={e =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                  >
                    <option value="">Select experience</option>
                    <option value="first-time">First-time Founder</option>
                    <option value="experienced">Experienced Founder</option>
                    <option value="serial">Serial Entrepreneur</option>
                  </select>
                </div>

                <div>
                  <Label>Your Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SKILLS_OPTIONS.map(skill => (
                      <Badge
                        key={skill}
                        variant={
                          formData.skills.includes(skill)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            skills: toggleArrayItem(formData.skills, skill),
                          })
                        }
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Your Industries</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {INDUSTRIES_OPTIONS.map(industry => (
                      <Badge
                        key={industry}
                        variant={
                          formData.industries.includes(industry)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            industries: toggleArrayItem(
                              formData.industries,
                              industry
                            ),
                          })
                        }
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  What You're Looking For
                </h3>
                <p className="text-muted-foreground">
                  Help us understand your ideal co-founder
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Looking For</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {LOOKING_FOR_OPTIONS.map(role => (
                      <Badge
                        key={role}
                        variant={
                          formData.lookingFor.includes(role)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            lookingFor: toggleArrayItem(
                              formData.lookingFor,
                              role
                            ),
                          })
                        }
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Target Industries</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {INDUSTRIES_OPTIONS.map(industry => (
                      <Badge
                        key={industry}
                        variant={
                          formData.targetIndustries.includes(industry)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetIndustries: toggleArrayItem(
                              formData.targetIndustries,
                              industry
                            ),
                          })
                        }
                      >
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="commitment">Commitment Level</Label>
                  <select
                    id="commitment"
                    className="w-full px-3 py-2 bg-input border border-border rounded-md"
                    value={formData.commitment}
                    onChange={e =>
                      setFormData({ ...formData, commitment: e.target.value })
                    }
                  >
                    <option value="">Select commitment</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Work Style & Values</h3>
                <p className="text-muted-foreground">
                  Let's understand how you work best
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Work Style</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {WORK_STYLE_OPTIONS.map(style => (
                      <Badge
                        key={style}
                        variant={
                          formData.workStyle.includes(style)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            workStyle: toggleArrayItem(
                              formData.workStyle,
                              style
                            ),
                          })
                        }
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Core Values</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {VALUES_OPTIONS.map(value => (
                      <Badge
                        key={value}
                        variant={
                          formData.values.includes(value)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            values: toggleArrayItem(formData.values, value),
                          })
                        }
                      >
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Review Your Profile</h3>
                <p className="text-muted-foreground">
                  Make sure everything looks good
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p>{formData.location || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Experience</Label>
                    <p>{formData.experience || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Commitment</Label>
                    <p>{formData.commitment || "Not specified"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Skills ({formData.skills.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.skills.map(skill => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Looking For ({formData.lookingFor.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.lookingFor.map(role => (
                      <Badge key={role}>{role}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Work Style ({formData.workStyle.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.workStyle.map(style => (
                      <Badge key={style}>{style}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createProfile.isPending}>
                {createProfile.isPending ? "Creating..." : "Complete Profile"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
