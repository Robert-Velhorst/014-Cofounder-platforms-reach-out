import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, TrendingUp, MessageSquare, Loader2 } from "lucide-react";

export default function NotificationSettings() {
  const { data: preferences, isLoading } =
    trpc.notifications.getPreferences.useQuery();
  const updatePreferences = trpc.notifications.updatePreferences.useMutation();

  const [settings, setSettings] = useState({
    emailNotificationsEnabled: true,
    notifyNewMatches: true,
    notifyMessages: true,
    weeklySummaryEnabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      await updatePreferences.mutateAsync(settings);
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications about your co-founder
          search.
        </p>
      </div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Enable or disable all email notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-base">
                Receive email notifications
              </Label>
              <Switch
                id="email-notifications"
                checked={settings.emailNotificationsEnabled}
                onCheckedChange={() =>
                  handleToggle("emailNotificationsEnabled")
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Individual Notification Types */}
        <Card
          className={!settings.emailNotificationsEnabled ? "opacity-50" : ""}
        >
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which events trigger email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* New Matches */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <Label
                    htmlFor="notify-matches"
                    className="text-base font-medium"
                  >
                    New Matches
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get notified when we find high-quality co-founder matches
                    for you
                  </p>
                </div>
              </div>
              <Switch
                id="notify-matches"
                checked={settings.notifyNewMatches}
                onCheckedChange={() => handleToggle("notifyNewMatches")}
                disabled={!settings.emailNotificationsEnabled}
              />
            </div>

            {/* Messages */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <Label
                    htmlFor="notify-messages"
                    className="text-base font-medium"
                  >
                    Messages & Responses
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get notified when prospects respond to your messages
                  </p>
                </div>
              </div>
              <Switch
                id="notify-messages"
                checked={settings.notifyMessages}
                onCheckedChange={() => handleToggle("notifyMessages")}
                disabled={!settings.emailNotificationsEnabled}
              />
            </div>

            {/* Weekly Summary */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <Label
                    htmlFor="weekly-summary"
                    className="text-base font-medium"
                  >
                    Weekly Summary
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive a weekly digest of your activity, matches, and
                    metrics
                  </p>
                </div>
              </div>
              <Switch
                id="weekly-summary"
                checked={settings.weeklySummaryEnabled}
                onCheckedChange={() => handleToggle("weeklySummaryEnabled")}
                disabled={!settings.emailNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {saveMessage && (
              <p
                className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}
              >
                {saveMessage}
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">About Notifications</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Notifications are sent to your registered email address
                  </li>
                  <li>• You can change these settings at any time</li>
                  <li>• Critical account notifications will always be sent</li>
                  <li>• Weekly summaries are sent every Monday at 9 AM</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
