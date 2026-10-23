import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  LanguageProvider,
  useLanguage,
  interfaceContentLanguage,
} from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";

const Home = lazy(() => import("./pages/Home"));
const Help = lazy(() => import("./pages/Help"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() =>
  import("./pages/AccountRecovery").then(module => ({
    default: module.ForgotPassword,
  }))
);
const ResetPassword = lazy(() =>
  import("./pages/AccountRecovery").then(module => ({
    default: module.ResetPassword,
  }))
);
const OutreachConsole = lazy(() => import("./pages/OutreachConsole"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LoadingPage() {
  const { text, language } = useLanguage();
  return (
    <div
      className="grid min-h-screen place-items-center bg-neutral-950 text-sm text-neutral-400"
      role="status"
      lang={language}
    >
      {text("Loading workspace…", "Werkruimte laden…")}
    </div>
  );
}

function Router() {
  const [path] = useLocation();
  const { language } = useLanguage();
  return (
    <div lang={interfaceContentLanguage(path, language)}>
      <Suspense fallback={<LoadingPage />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/help" component={Help} />
          <Route path="/login" component={Login} />
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/outreach" component={OutreachConsole} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/admin/security" component={AdminSecurity} />
          <Route path="/dashboard">
            <Redirect to="/outreach" />
          </Route>
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <LanguageSelector />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
