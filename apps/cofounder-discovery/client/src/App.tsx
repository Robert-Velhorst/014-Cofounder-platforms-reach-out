import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import VerifyEmail from "./pages/VerifyEmail";
import SavedSearches from "./pages/SavedSearches";
import Scheduler from "./pages/Scheduler";
import Enrichment from "@/pages/Enrichment";
import ConnectedAccounts from "@/pages/ConnectedAccounts";
import AdminAnalytics from "@/pages/AdminAnalytics";
import SuccessMetrics from "@/pages/SuccessMetrics";
import ProspectTimeline from "@/pages/ProspectTimeline";
import NotificationSettings from "./pages/NotificationSettings";
import { Usage } from "@/pages/Usage";
import Pipeline from "@/pages/Pipeline";
import AIMonitoring from "@/pages/AIMonitoring";
import ApprovalQueue from "@/pages/ApprovalQueue";
import PlatformConnections from "@/pages/PlatformConnections";
import CampaignSettings from "@/pages/CampaignSettings";
import Layout from "./components/Layout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/matches">
        <Layout>
          <Matches />
        </Layout>
      </Route>
      <Route path="/messages">
        <Layout>
          <Messages />
        </Layout>
      </Route>
      <Route path="/campaigns">
        <Layout>
          <Campaigns />
        </Layout>
      </Route>
      <Route path="/analytics">
        <Layout>
          <Analytics />
        </Layout>
      </Route>
      <Route path="/settings">
        <Layout>
          <Settings />
        </Layout>
      </Route>
      <Route path="/usage">
        <Layout>
          <Usage />
        </Layout>
      </Route>
      <Route path="/pipeline">
        <Layout>
          <Pipeline />
        </Layout>
      </Route>
      <Route path="/ai-monitoring">
        <Layout>
          <AIMonitoring />
        </Layout>
      </Route>
      <Route path="/approval-queue">
        <Layout>
          <ApprovalQueue />
        </Layout>
      </Route>
      <Route path="/platform-connections">
        <Layout>
          <PlatformConnections />
        </Layout>
      </Route>
      <Route path="/campaigns/:id/settings">
        <Layout>
          <CampaignSettings />
        </Layout>
      </Route>
      <Route path="/help">
        <Layout>
          <Help />
        </Layout>
      </Route>
      <Route path="/saved-searches">
        <Layout>
          <SavedSearches />
        </Layout>
      </Route>
      <Route path="/scheduler">
        <Layout>
          <Scheduler />
        </Layout>
      </Route>
      <Route path="/enrichment">
        <Layout>
          <Enrichment />
        </Layout>
      </Route>
      <Route path="/connected-accounts">
        <Layout>
          <ConnectedAccounts />
        </Layout>
      </Route>
      <Route path="/admin/analytics">
        <Layout>
          <AdminAnalytics />
        </Layout>
      </Route>
      <Route path="/success-metrics">
        <Layout>
          <SuccessMetrics />
        </Layout>
      </Route>
      <Route path="/prospect/:prospectId/timeline">
        <Layout>
          <ProspectTimeline />
        </Layout>
      </Route>
      <Route path="/settings/notifications">
        <Layout>
          <NotificationSettings />
        </Layout>
      </Route>
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
