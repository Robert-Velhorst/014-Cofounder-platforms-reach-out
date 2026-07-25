import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");

    if (tokenParam) {
      setToken(tokenParam);
      verifyMutation.mutate({ token: tokenParam });
    }
  }, []);

  const handleGoToDashboard = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm max-w-md w-full">
        <div className="p-8 text-center">
          {verifyMutation.isPending && (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verifying your email...
              </h1>
              <p className="text-gray-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {verifyMutation.isSuccess && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-400 mb-6">
                Your email has been successfully verified. You can now access
                all features of the platform.
              </p>
              <Button
                onClick={handleGoToDashboard}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {verifyMutation.isError && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-400 mb-6">
                {verifyMutation.error?.message ||
                  "The verification link is invalid or has expired. Please request a new verification email."}
              </p>
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="border-white/10"
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {!token && !verifyMutation.isPending && (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                No Verification Token
              </h1>
              <p className="text-gray-400 mb-6">
                No verification token was provided. Please check your email for
                the verification link.
              </p>
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                className="border-white/10"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
