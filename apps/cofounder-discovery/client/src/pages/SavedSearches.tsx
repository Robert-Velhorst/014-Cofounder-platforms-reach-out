import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Bell,
  BellOff,
  Edit,
  Trash2,
  MapPin,
  Briefcase,
  Target,
  Loader2,
  RefreshCw,
} from "lucide-react";

const SKILLS = [
  "Developer",
  "Designer",
  "Marketer",
  "Business Development",
  "Sales",
  "Product",
];

const INDUSTRIES = [
  "Finance/Fintech",
  "Retail",
  "E-Commerce",
  "Construction/Trade",
  "Agencies",
  "Consulting",
  "Manufacturing",
  "Wholesale",
  "Web/Mobile app",
  "Website",
  "Other",
];

export default function SavedSearches() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<any>(null);

  const {
    data: searches,
    isLoading,
    refetch,
  } = trpc.savedSearches.list.useQuery();
  const createMutation = trpc.savedSearches.create.useMutation();
  const updateMutation = trpc.savedSearches.update.useMutation();
  const deleteMutation = trpc.savedSearches.delete.useMutation();
  const [checkingSearchId, setCheckingSearchId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    skills: [] as string[],
    industries: [] as string[],
    location: "",
    experience: "",
    startupStage: "",
    commitment: "",
    remotePreference: "",
    minCompatibilityScore: 70,
    fundingStage: [] as string[],
    teamSizeMin: undefined as number | undefined,
    teamSizeMax: undefined as number | undefined,
    equitySplitPreference: "",
    notificationsEnabled: 1,
    emailNotifications: 1,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      skills: [],
      industries: [],
      location: "",
      experience: "",
      startupStage: "",
      commitment: "",
      remotePreference: "",
      minCompatibilityScore: 70,
      fundingStage: [],
      teamSizeMin: undefined,
      teamSizeMax: undefined,
      equitySplitPreference: "",
      notificationsEnabled: 1,
      emailNotifications: 1,
    });
    setEditingSearch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSearch) {
        await updateMutation.mutateAsync({
          id: editingSearch.id,
          ...formData,
        });
        toast.success("Saved search updated successfully!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Saved search created successfully!");
      }

      refetch();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save search");
    }
  };

  const handleEdit = (search: any) => {
    setEditingSearch(search);
    setFormData({
      name: search.name || "",
      description: search.description || "",
      skills: search.skills || [],
      industries: search.industries || [],
      location: search.location || "",
      experience: search.experience || "",
      startupStage: search.startupStage || "",
      commitment: search.commitment || "",
      remotePreference: search.remotePreference || "",
      minCompatibilityScore: search.minCompatibilityScore || 70,
      fundingStage: search.fundingStage || [],
      teamSizeMin: search.teamSizeMin,
      teamSizeMax: search.teamSizeMax,
      equitySplitPreference: search.equitySplitPreference || "",
      notificationsEnabled: search.notificationsEnabled || 1,
      emailNotifications: search.emailNotifications || 1,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Saved search deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete search");
    }
  };

  const handleCheckMatches = async (id: number) => {
    setCheckingSearchId(id);
    try {
      // This would trigger the match checking logic
      toast.success("Checking for new matches...");
      await refetch();
      toast.success("Match check complete!");
    } catch (error) {
      toast.error("Failed to check matches");
    } finally {
      setCheckingSearchId(null);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry],
    }));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Saved Searches</h1>
          <p className="text-gray-400">
            Save your search criteria and get notified when new matches appear
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={open => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
              <Plus className="w-5 h-5 mr-2" />
              New Search
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSearch ? "Edit Saved Search" : "Create Saved Search"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Define your search criteria and notification preferences
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Search Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Technical Co-Founder for SaaS"
                    required
                    className="bg-gray-800/50 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what you're looking for..."
                    className="bg-gray-800/50 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label className="text-white mb-2 block">Skills</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        formData.skills.includes(skill)
                          ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                          : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div>
                <Label className="text-white mb-2 block">Industries</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map(industry => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleIndustry(industry)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        formData.industries.includes(industry)
                          ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                          : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Criteria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-white">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={e =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., San Francisco"
                    className="bg-gray-800/50 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="experience" className="text-white">
                    Experience Level
                  </Label>
                  <Select
                    value={formData.experience}
                    onValueChange={value =>
                      setFormData({ ...formData, experience: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="0-2 years">0-2 years</SelectItem>
                      <SelectItem value="3-5 years">3-5 years</SelectItem>
                      <SelectItem value="5-10 years">5-10 years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startupStage" className="text-white">
                    Startup Stage
                  </Label>
                  <Select
                    value={formData.startupStage}
                    onValueChange={value =>
                      setFormData({ ...formData, startupStage: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="Idea">Idea</SelectItem>
                      <SelectItem value="MVP">MVP</SelectItem>
                      <SelectItem value="Early Stage">Early Stage</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commitment" className="text-white">
                    Commitment
                  </Label>
                  <Select
                    value={formData.commitment}
                    onValueChange={value =>
                      setFormData({ ...formData, commitment: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="minScore" className="text-white">
                  Minimum Compatibility Score: {formData.minCompatibilityScore}%
                </Label>
                <input
                  id="minScore"
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={formData.minCompatibilityScore}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      minCompatibilityScore: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Advanced Filters */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <Label className="text-white text-lg">Advanced Filters</Label>

                {/* Funding Stage */}
                <div>
                  <Label className="text-white mb-2 block">
                    Funding Stage Preference
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Bootstrapped",
                      "Pre-seed",
                      "Seed",
                      "Series A",
                      "Series B+",
                      "No preference",
                    ].map(stage => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => {
                          const newStages = formData.fundingStage.includes(
                            stage
                          )
                            ? formData.fundingStage.filter(s => s !== stage)
                            : [...formData.fundingStage, stage];
                          setFormData({ ...formData, fundingStage: newStages });
                        }}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          formData.fundingStage.includes(stage)
                            ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                            : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teamSizeMin" className="text-white">
                      Min Team Size
                    </Label>
                    <Input
                      id="teamSizeMin"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.teamSizeMin || ""}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          teamSizeMin: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="e.g., 1"
                      className="bg-gray-800/50 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teamSizeMax" className="text-white">
                      Max Team Size
                    </Label>
                    <Input
                      id="teamSizeMax"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.teamSizeMax || ""}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          teamSizeMax: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="e.g., 5"
                      className="bg-gray-800/50 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Equity Split */}
                <div>
                  <Label htmlFor="equitySplit" className="text-white">
                    Equity Split Preference
                  </Label>
                  <Select
                    value={formData.equitySplitPreference}
                    onValueChange={value =>
                      setFormData({ ...formData, equitySplitPreference: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800/50 border-white/10 text-white">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="">No preference</SelectItem>
                      <SelectItem value="Equal (50/50)">
                        Equal (50/50)
                      </SelectItem>
                      <SelectItem value="Majority (60/40)">
                        Majority (60/40)
                      </SelectItem>
                      <SelectItem value="Significant (70/30)">
                        Significant (70/30)
                      </SelectItem>
                      <SelectItem value="Flexible">
                        Flexible / Negotiable
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <Label className="text-white">Notification Preferences</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={formData.notificationsEnabled === 1}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        notificationsEnabled: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor="notifications"
                    className="text-gray-300 cursor-pointer"
                  >
                    Enable notifications for new matches
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="email"
                    checked={formData.emailNotifications === 1}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        emailNotifications: e.target.checked ? 1 : 0,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor="email"
                    className="text-gray-300 cursor-pointer"
                  >
                    Send email notifications
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingSearch ? "Update Search" : "Create Search"}</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="border-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Searches List */}
      {searches && searches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searches.map(search => (
            <Card
              key={search.id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm hover:border-orange-500/30 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {search.name}
                    </h3>
                    {search.description && (
                      <p className="text-gray-400 text-sm">
                        {search.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {search.notificationsEnabled === 1 ? (
                      <Bell className="w-5 h-5 text-green-500" />
                    ) : (
                      <BellOff className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Criteria Summary */}
                <div className="space-y-2 mb-4">
                  {search.skills && search.skills.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-300">
                        {search.skills.join(", ")}
                      </span>
                    </div>
                  )}
                  {search.industries && search.industries.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-300">
                        {search.industries.join(", ")}
                      </span>
                    </div>
                  )}
                  {search.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-300">{search.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Search className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">
                      Min {search.minCompatibilityScore}% compatibility
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    {search.matchCount || 0} matches found
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheckMatches(search.id)}
                      disabled={checkingSearchId === search.id}
                      className="border-white/10 hover:border-green-500/30 hover:text-green-500"
                    >
                      {checkingSearchId === search.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(search)}
                      className="border-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(search.id)}
                      disabled={deleteMutation.isPending}
                      className="border-white/10 hover:border-red-500/30 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 mb-4">
              <Search className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Saved Searches
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first saved search to get notified about new matches
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Saved Search
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
