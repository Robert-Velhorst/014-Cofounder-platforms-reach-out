import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { Redirect, useLocation } from "wouter";
import type { UserProfile } from "../../../drizzle/schema";
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

const DUTCH_PROFILE_OPTIONS: Readonly<Record<string, string>> = {
  Developer: "Softwareontwikkelaar",
  Designer: "Ontwerper",
  Marketer: "Marketeer",
  "Business Development": "Bedrijfsontwikkeling",
  Sales: "Verkoop",
  Product: "Product",
  "Finance/ Fintech": "Financiën / fintech",
  Retail: "Detailhandel",
  "E-Commerce": "E-commerce",
  "Construction/ Trade": "Bouw / vakhandel",
  "Agency - digital (eg, marketing, Web design)":
    "Digitaal bureau (bijv. marketing, webontwerp)",
  "Agency - other (eg real estate, recruitment)":
    "Ander bureau (bijv. vastgoed, werving)",
  Consulting: "Advies",
  Manufacturing: "Productie",
  Wholesale: "Groothandel",
  "Web or Mobile app": "Web- of mobiele app",
  "Website (eg news, affiliate)": "Website (bijv. nieuws, affiliate)",
  Other: "Overig",
  "Technical Co-Founder": "Technische medeoprichter",
  "Business Co-Founder": "Zakelijke medeoprichter",
  "Marketing Co-Founder": "Marketingmedeoprichter",
  "Product Co-Founder": "Productmedeoprichter",
  CTO: "CTO",
  CEO: "CEO",
  CMO: "CMO",
  Collaborative: "Samenwerkend",
  Independent: "Zelfstandig",
  Analytical: "Analytisch",
  Creative: "Creatief",
  Strategic: "Strategisch",
  "Hands-on": "Praktisch",
  Innovation: "Innovatie",
  "Customer-first": "Klantgericht",
  Sustainability: "Duurzaamheid",
  Growth: "Groei",
  Quality: "Kwaliteit",
  Speed: "Snelheid",
  Transparency: "Transparantie",
  "first-time": "Startende oprichter",
  experienced: "Ervaren oprichter",
  serial: "Seriële ondernemer",
  "full-time": "Voltijds",
  "part-time": "Deeltijds",
  flexible: "Flexibel",
};

export default function Onboarding() {
  const { text } = useLanguage();
  const { user, loading, error: accountError, refresh } = useAuth();
  if (loading)
    return (
      <p role="status" className="p-8">
        {text("Checking your account…", "Je account wordt gecontroleerd…")}
      </p>
    );
  if (!user && !accountError) return <Redirect to="/login" />;
  if (user && user.emailVerified !== 1) return <Redirect to="/verify-email" />;
  if (!user)
    return (
      <div role="alert" className="p-8">
        {text(
          "Could not check your account.",
          "Je account kon niet worden gecontroleerd."
        )}{" "}
        <Button onClick={() => refresh()}>
          {text("Retry account check", "Account opnieuw controleren")}
        </Button>
      </div>
    );
  return (
    <OwnerProfile
      key={user.id}
      userId={user.id}
      accountBlocked={Boolean(accountError)}
      refreshAccount={refresh}
    />
  );
}

function OwnerProfile({
  userId,
  accountBlocked,
  refreshAccount,
}: {
  userId: number;
  accountBlocked: boolean;
  refreshAccount: () => Promise<unknown>;
}) {
  const { text } = useLanguage();
  const profile = trpc.profile.get.useQuery(
    { accountId: userId },
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: "always",
    }
  );
  const [initial, setInitial] = useState<{
    profile: UserProfile | null;
  } | null>(null);
  const wrongOwner = profile.data && profile.data.userId !== userId;
  const blocked = Boolean(accountBlocked || profile.isError || wrongOwner);
  useEffect(() => {
    if (
      !initial &&
      !blocked &&
      profile.isFetchedAfterMount &&
      profile.isSuccess &&
      !profile.isFetching &&
      profile.data !== undefined
    ) {
      setInitial({ profile: profile.data });
    }
  }, [
    initial,
    blocked,
    profile.isFetchedAfterMount,
    profile.isSuccess,
    profile.isFetching,
    profile.data,
  ]);
  return (
    <>
      {blocked ? (
        <div role="alert" className="p-8">
          {text(
            "Could not check your account or saved profile. Editing is paused; any open edits are retained.",
            "Je account of opgeslagen profiel kon niet worden gecontroleerd. Bewerken is gepauzeerd; open wijzigingen blijven behouden."
          )}
          <Button
            className="ml-3"
            disabled={profile.isFetching}
            onClick={async () => {
              await refreshAccount();
              await profile.refetch();
            }}
          >
            {text("Retry profile check", "Profiel opnieuw controleren")}
          </Button>
        </div>
      ) : null}
      {initial ? (
        <ProfileForm
          ownerId={userId}
          initialProfile={initial.profile}
          disabled={blocked}
        />
      ) : !blocked ? (
        <p role="status" className="p-8">
          {text(
            "Loading your saved profile…",
            "Je opgeslagen profiel wordt geladen…"
          )}
        </p>
      ) : null}
    </>
  );
}

export function ProfileForm({
  ownerId,
  initialProfile,
  disabled,
}: {
  ownerId: number;
  initialProfile: UserProfile | null;
  disabled: boolean;
}) {
  const { language, text } = useLanguage();
  const optionLabel = (value: string) =>
    language === "nl" ? (DUTCH_PROFILE_OPTIONS[value] ?? value) : value;
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const inFlight = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => ({
    location: initialProfile?.location ?? "",
    skills: initialProfile?.skills ?? [],
    experience: initialProfile?.experience ?? "",
    industries: initialProfile?.industries ?? [],
    lookingFor: initialProfile?.lookingFor ?? [],
    targetIndustries: initialProfile?.targetIndustries ?? [],
    workStyle: initialProfile?.workStyle ?? [],
    values: initialProfile?.values ?? [],
    commitment: initialProfile?.commitment ?? "",
  }));

  const createProfile = trpc.profile.create.useMutation({
    onSuccess: saved => {
      utils.profile.get.setData({ accountId: saved.userId }, saved);
      toast.success(text("Private profile saved", "Privéprofiel opgeslagen"));
      setLocation("/outreach");
    },
  });

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  const handleSubmit = async () => {
    if (inFlight.current || disabled) return;
    inFlight.current = true;
    setSaveError(null);
    try {
      await createProfile.mutateAsync({
        ...formData,
        isPublic: false,
        accountId: ownerId,
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Profile could not be saved. Your edits are retained."
      );
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 py-12">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              {text(
                "Your co-founder search profile",
                "Je zoekprofiel voor een medeoprichter"
              )}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {text(
              "Describe your background and goals to support your own prospect review.",
              "Beschrijf je achtergrond en doelen om je eigen beoordeling van kandidaten te ondersteunen."
            )}
          </p>
          <p className="mt-4 font-semibold">
            {text("Private profile", "Privéprofiel")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {text(
              "Saving keeps this profile in your account; it does not publish it or send it to co-founder platforms. A public-directory publishing workflow is not available. Unsaved edits are kept in this page only and are lost on reload.",
              "Opslaan bewaart dit profiel in je account; het wordt niet gepubliceerd of naar platforms voor medeoprichters gestuurd. Publicatie in een openbare gids is niet beschikbaar. Niet-opgeslagen wijzigingen blijven alleen op deze pagina en gaan verloren bij opnieuw laden."
            )}
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
          <fieldset
            disabled={disabled || createProfile.isPending}
            className="min-w-0"
          >
            <legend className="sr-only">
              {text("Private profile editor", "Privéprofiel bewerken")}
            </legend>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {text("Basic Information", "Basisgegevens")}
                  </h3>
                  <p className="text-muted-foreground">
                    {text(
                      "Where are you based and what's your experience level?",
                      "Waar woon je en hoeveel ervaring heb je?"
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">
                      {text("Location", "Locatie")}
                    </Label>
                    <Input
                      id="location"
                      maxLength={255}
                      placeholder={text(
                        "e.g., San Francisco, CA",
                        "bijv. Arnhem, Nederland"
                      )}
                      value={formData.location}
                      onChange={e =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">
                      {text("Experience Level", "Ervaringsniveau")}
                    </Label>
                    <select
                      id="experience"
                      className="w-full px-3 py-2 bg-input border border-border rounded-md"
                      value={formData.experience}
                      onChange={e =>
                        setFormData({ ...formData, experience: e.target.value })
                      }
                    >
                      <option value="">
                        {text("Select experience", "Kies je ervaring")}
                      </option>
                      <option value="first-time">
                        {text("First-time Founder", "Startende oprichter")}
                      </option>
                      <option value="experienced">
                        {text("Experienced Founder", "Ervaren oprichter")}
                      </option>
                      <option value="serial">
                        {text("Serial Entrepreneur", "Seriële ondernemer")}
                      </option>
                    </select>
                  </div>

                  <div>
                    <Label>{text("Your Skills", "Je vaardigheden")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SKILLS_OPTIONS.map(skill => (
                        <Button
                          type="button"
                          aria-pressed={formData.skills.includes(skill)}
                          key={optionLabel(skill)}
                          variant={
                            formData.skills.includes(skill)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto max-w-full whitespace-normal text-left"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              skills: toggleArrayItem(formData.skills, skill),
                            })
                          }
                        >
                          {optionLabel(skill)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>{text("Your Industries", "Je sectoren")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {INDUSTRIES_OPTIONS.map(industry => (
                        <Button
                          type="button"
                          aria-pressed={formData.industries.includes(industry)}
                          key={optionLabel(industry)}
                          variant={
                            formData.industries.includes(industry)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto max-w-full whitespace-normal text-left"
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
                          {optionLabel(industry)}
                        </Button>
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
                    {text("What You're Looking For", "Wat je zoekt")}
                  </h3>
                  <p className="text-muted-foreground">
                    {text(
                      "Help us understand your ideal co-founder",
                      "Beschrijf je ideale medeoprichter"
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>{text("Looking For", "Gezochte rollen")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LOOKING_FOR_OPTIONS.map(role => (
                        <Button
                          type="button"
                          aria-pressed={formData.lookingFor.includes(role)}
                          key={optionLabel(role)}
                          variant={
                            formData.lookingFor.includes(role)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto max-w-full whitespace-normal text-left"
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
                          {optionLabel(role)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>{text("Target Industries", "Doelsectoren")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {INDUSTRIES_OPTIONS.map(industry => (
                        <Button
                          type="button"
                          aria-pressed={formData.targetIndustries.includes(
                            industry
                          )}
                          key={optionLabel(industry)}
                          variant={
                            formData.targetIndustries.includes(industry)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto max-w-full whitespace-normal text-left"
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
                          {optionLabel(industry)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="commitment">
                      {text("Commitment Level", "Beschikbare inzet")}
                    </Label>
                    <select
                      id="commitment"
                      className="w-full px-3 py-2 bg-input border border-border rounded-md"
                      value={formData.commitment}
                      onChange={e =>
                        setFormData({ ...formData, commitment: e.target.value })
                      }
                    >
                      <option value="">
                        {text("Select commitment", "Kies je inzet")}
                      </option>
                      <option value="full-time">
                        {text("Full-time", "Voltijds")}
                      </option>
                      <option value="part-time">
                        {text("Part-time", "Deeltijds")}
                      </option>
                      <option value="flexible">
                        {text("Flexible", "Flexibel")}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {text("Work Style & Values", "Werkstijl en waarden")}
                  </h3>
                  <p className="text-muted-foreground">
                    {text(
                      "Let's understand how you work best",
                      "Beschrijf hoe je het beste werkt"
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>{text("Work Style", "Werkstijl")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {WORK_STYLE_OPTIONS.map(style => (
                        <Button
                          type="button"
                          aria-pressed={formData.workStyle.includes(style)}
                          key={optionLabel(style)}
                          variant={
                            formData.workStyle.includes(style)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto max-w-full whitespace-normal text-left"
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
                          {optionLabel(style)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>{text("Core Values", "Kernwaarden")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {VALUES_OPTIONS.map(value => (
                        <Button
                          type="button"
                          aria-pressed={formData.values.includes(value)}
                          key={optionLabel(value)}
                          variant={
                            formData.values.includes(value)
                              ? "default"
                              : "outline"
                          }
                          className="h-auto max-w-full whitespace-normal text-left"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              values: toggleArrayItem(formData.values, value),
                            })
                          }
                        >
                          {optionLabel(value)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {text("Review Your Profile", "Controleer je profiel")}
                  </h3>
                  <p className="text-muted-foreground">
                    {text(
                      "Make sure everything looks good",
                      "Controleer je keuzes voordat je opslaat"
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        {text("Location", "Locatie")}
                      </Label>
                      <p>
                        {formData.location ||
                          text("Not specified", "Niet ingevuld")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        {text("Experience", "Ervaring")}
                      </Label>
                      <p>
                        {formData.experience
                          ? optionLabel(formData.experience)
                          : text("Not specified", "Niet ingevuld")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        {text("Commitment", "Inzet")}
                      </Label>
                      <p>
                        {formData.commitment
                          ? optionLabel(formData.commitment)
                          : text("Not specified", "Niet ingevuld")}
                      </p>
                    </div>
                  </div>

                  {(["industries", "targetIndustries", "values"] as const).map(
                    field => (
                      <div key={field}>
                        <Label className="text-muted-foreground">
                          {field === "industries"
                            ? text("Your Industries", "Je sectoren")
                            : field === "targetIndustries"
                              ? text("Target Industries", "Doelsectoren")
                              : text("Core Values", "Kernwaarden")}{" "}
                          ({formData[field].length})
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData[field].length ? (
                            formData[field].map(item => (
                              <Badge key={item}>{optionLabel(item)}</Badge>
                            ))
                          ) : (
                            <p>{text("Not specified", "Niet ingevuld")}</p>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  <div>
                    <Label className="text-muted-foreground">
                      {text("Skills", "Vaardigheden")} ({formData.skills.length}
                      )
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.skills.map(skill => (
                        <Badge key={optionLabel(skill)}>
                          {optionLabel(skill)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">
                      {text("Looking For", "Gezochte rollen")} (
                      {formData.lookingFor.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.lookingFor.map(role => (
                        <Badge key={optionLabel(role)}>
                          {optionLabel(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">
                      {text("Work Style", "Werkstijl")} (
                      {formData.workStyle.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.workStyle.map(style => (
                        <Badge key={optionLabel(style)}>
                          {optionLabel(style)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            {saveError ? (
              <p role="alert" lang="en" className="mt-4 text-sm text-red-400">
                {saveError}
              </p>
            ) : null}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {text("Back", "Terug")}
              </Button>

              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)}>
                  {text("Next", "Volgende")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createProfile.isPending}
                >
                  {createProfile.isPending
                    ? text("Saving…", "Opslaan…")
                    : text("Save private profile", "Privéprofiel opslaan")}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </fieldset>
        </Card>
      </div>
    </div>
  );
}
