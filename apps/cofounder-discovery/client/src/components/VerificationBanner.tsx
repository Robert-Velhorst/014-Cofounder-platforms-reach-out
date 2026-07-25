import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function VerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: status } = trpc.auth.checkVerificationStatus.useQuery();
  const sendEmail = trpc.auth.sendVerificationEmail.useMutation();

  const handleSendVerification = async () => {
    try {
      const result = await sendEmail.mutateAsync();
      if (result.success) {
        toast.success("Verification email sent!", {
          description: "Check your inbox for the verification link.",
        });
      }
    } catch (error) {
      toast.error("Failed to send verification email", {
        description: "Please try again later.",
      });
    }
  };

  if (dismissed || status?.verified) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/30 backdrop-blur-sm mb-6">
      <div className="p-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">
            Verify your email address
          </h3>
          <p className="text-sm text-gray-300">
            Please verify your email to unlock all features and start connecting
            with co-founders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSendVerification}
            disabled={sendEmail.isPending}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            {sendEmail.isPending ? "Sending..." : "Send Verification Email"}
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
