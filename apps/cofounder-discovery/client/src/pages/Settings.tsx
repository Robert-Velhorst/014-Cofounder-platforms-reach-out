import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  User,
  Bell,
  Link as LinkIcon,
  Shield,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "platforms" | "account"
  >("profile");

  const { data: profile, refetch: refetchProfile } = trpc.profile.get.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetchProfile();
    },
    onError: error => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const [profileForm, setProfileForm] = useState({
    location: profile?.location || "",
    timezone: profile?.timezone || "",
    availability: profile?.availability || "",
    skills: profile?.skills || [],
    experience: profile?.experience || "",
    industries: profile?.industries || [],
    lookingFor: profile?.lookingFor || [],
    startupStage: profile?.startupStage || "",
    commitment: profile?.commitment || "",
    workStyle: profile?.workStyle || [],
    values: profile?.values || [],
    communicationStyle: profile?.communicationStyle || "",
    remotePreference: profile?.remotePreference || "",
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        location: profile.location || "",
        timezone: profile.timezone || "",
        availability: profile.availability || "",
        skills: profile.skills || [],
        experience: profile.experience || "",
        industries: profile.industries || [],
        lookingFor: profile.lookingFor || [],
        startupStage: profile.startupStage || "",
        commitment: profile.commitment || "",
        workStyle: profile.workStyle || [],
        values: profile.values || [],
        communicationStyle: profile.communicationStyle || "",
        remotePreference: profile.remotePreference || "",
      });
    }
  }, [profile]);

  const handleProfileUpdate = () => {
    updateProfile.mutate(profileForm);
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "platforms" as const, label: "Connected Platforms", icon: LinkIcon },
    { id: "account" as const, label: "Account", icon: Shield },
  ];

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm h-fit">
          <div className="p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Profile Settings
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Update your profile information and preferences
                </p>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Name</Label>
                      <Input
                        value={user.name || ""}
                        disabled
                        className="bg-gray-800/50 border-white/10 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Name is managed by your account
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Email</Label>
                      <Input
                        value={user.email || ""}
                        disabled
                        className="bg-gray-800/50 border-white/10 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email is managed by your account
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location & Availability */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Location & Availability
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Location</Label>
                      <Input
                        value={profileForm.location}
                        onChange={e =>
                          setProfileForm({
                            ...profileForm,
                            location: e.target.value,
                          })
                        }
                        placeholder="e.g., San Francisco, CA"
                        className="bg-gray-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Timezone</Label>
                      <Input
                        value={profileForm.timezone}
                        onChange={e =>
                          setProfileForm({
                            ...profileForm,
                            timezone: e.target.value,
                          })
                        }
                        placeholder="e.g., PST, EST"
                        className="bg-gray-800/50 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-gray-300">Availability</Label>
                    <Input
                      value={profileForm.availability}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          availability: e.target.value,
                        })
                      }
                      placeholder="e.g., Full-time, Part-time, Weekends"
                      className="bg-gray-800/50 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Skills & Industries */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Skills & Industries
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Your Skills</Label>
                      <TagInput
                        value={profileForm.skills}
                        onChange={skills =>
                          setProfileForm({ ...profileForm, skills })
                        }
                        placeholder="Add your skills (e.g., React, Python, Marketing)"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Target Industries</Label>
                      <TagInput
                        value={profileForm.industries}
                        onChange={industries =>
                          setProfileForm({ ...profileForm, industries })
                        }
                        placeholder="Add industries (e.g., FinTech, HealthTech, SaaS)"
                      />
                    </div>
                  </div>
                </div>

                {/* Experience & Startup Goals */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Experience & Goals
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Experience Level</Label>
                      <Select
                        value={profileForm.experience}
                        onValueChange={value =>
                          setProfileForm({ ...profileForm, experience: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first-time">
                            First-time Founder
                          </SelectItem>
                          <SelectItem value="experienced">
                            Experienced Founder
                          </SelectItem>
                          <SelectItem value="serial">
                            Serial Entrepreneur
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Startup Stage</Label>
                      <Select
                        value={profileForm.startupStage}
                        onValueChange={value =>
                          setProfileForm({
                            ...profileForm,
                            startupStage: value,
                          })
                        }
                      >
                        <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                          <SelectValue placeholder="Select startup stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea Stage</SelectItem>
                          <SelectItem value="mvp">MVP/Prototype</SelectItem>
                          <SelectItem value="early">Early Revenue</SelectItem>
                          <SelectItem value="growth">Growth Stage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-gray-300">Looking For</Label>
                    <TagInput
                      value={profileForm.lookingFor}
                      onChange={lookingFor =>
                        setProfileForm({ ...profileForm, lookingFor })
                      }
                      placeholder="What are you looking for? (e.g., Technical Co-Founder, CTO)"
                    />
                  </div>
                </div>

                {/* Work Style & Preferences */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Work Style & Preferences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Work Style</Label>
                      <TagInput
                        value={profileForm.workStyle}
                        onChange={workStyle =>
                          setProfileForm({ ...profileForm, workStyle })
                        }
                        placeholder="Describe your work style (e.g., Fast-paced, Data-driven)"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Core Values</Label>
                      <TagInput
                        value={profileForm.values}
                        onChange={values =>
                          setProfileForm({ ...profileForm, values })
                        }
                        placeholder="Your core values (e.g., Transparency, Innovation)"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">
                          Communication Style
                        </Label>
                        <Select
                          value={profileForm.communicationStyle}
                          onValueChange={value =>
                            setProfileForm({
                              ...profileForm,
                              communicationStyle: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                            <SelectValue placeholder="Select communication style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct">Direct</SelectItem>
                            <SelectItem value="collaborative">
                              Collaborative
                            </SelectItem>
                            <SelectItem value="analytical">
                              Analytical
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-300">
                          Remote Preference
                        </Label>
                        <Select
                          value={profileForm.remotePreference}
                          onValueChange={value =>
                            setProfileForm({
                              ...profileForm,
                              remotePreference: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                            <SelectValue placeholder="Select remote preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Fully Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="in-person">In-Person</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Commitment Level</Label>
                      <Select
                        value={profileForm.commitment}
                        onValueChange={value =>
                          setProfileForm({ ...profileForm, commitment: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                          <SelectValue placeholder="Select commitment level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="weekends">
                            Weekends/Evenings
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={updateProfile.isPending}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Notification Preferences
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Choose what notifications you want to receive
                </p>
              </div>
              <div className="p-6 space-y-6">
                {[
                  {
                    label: "New Matches",
                    description:
                      "Get notified when we find compatible co-founders",
                  },
                  {
                    label: "Messages",
                    description:
                      "Receive alerts for new messages from prospects",
                  },
                  {
                    label: "Campaign Updates",
                    description:
                      "Updates on your outreach campaign performance",
                  },
                  {
                    label: "Weekly Summary",
                    description: "Weekly digest of your activity and matches",
                  },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-white/5"
                  >
                    <div>
                      <h4 className="font-medium text-white">{item.label}</h4>
                      <p className="text-sm text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Enabled
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "platforms" && (
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-orange-500" />
                  Connected Platforms
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Manage your connections to co-founder platforms
                </p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  {
                    name: "CoFoundersLab",
                    status: "disconnected",
                    color: "blue",
                  },
                  {
                    name: "FounderCloud",
                    status: "disconnected",
                    color: "purple",
                  },
                  {
                    name: "Y Combinator",
                    status: "connected",
                    color: "orange",
                  },
                ].map(platform => (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${platform.color}-500/20 to-${platform.color}-600/20 border border-${platform.color}-500/30 flex items-center justify-center`}
                      >
                        <LinkIcon
                          className={`w-6 h-6 text-${platform.color}-400`}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">
                          {platform.name}
                        </h4>
                        <p className="text-sm text-gray-400 capitalize">
                          {platform.status}
                        </p>
                      </div>
                    </div>
                    {platform.status === "connected" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "account" && (
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" />
                  Account Details
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  View your account information and activity
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-400 text-sm">Account ID</Label>
                    <p className="text-white font-mono mt-1">{user.id}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">
                      Login Method
                    </Label>
                    <p className="text-white mt-1">
                      {user.loginMethod || "OAuth"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">
                      Member Since
                    </Label>
                    <p className="text-white mt-1">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm">
                      Last Sign In
                    </Label>
                    <p className="text-white mt-1">
                      {new Date(user.lastSignedIn).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Activity Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Matches", value: "0" },
                      { label: "Messages Sent", value: "0" },
                      { label: "Campaigns", value: "0" },
                      { label: "Profile Views", value: "0" },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="p-4 rounded-lg bg-gray-800/30 border border-white/5"
                      >
                        <p className="text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
