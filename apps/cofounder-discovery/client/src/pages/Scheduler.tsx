import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
// Toast notifications removed - using simple alerts instead
import {
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function Scheduler() {
  const toast = (opts: any) => {
    if (opts.variant === "destructive") {
      alert(`Error: ${opts.description}`);
    } else {
      console.log(opts.title, opts.description);
    }
  };
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  const { data: schedulerStatus, refetch } = trpc.scheduler.status.useQuery();
  const startScheduler = trpc.scheduler.start.useMutation();
  const stopScheduler = trpc.scheduler.stop.useMutation();
  const triggerJob = trpc.scheduler.triggerJob.useMutation();
  const startJob = trpc.scheduler.startJob.useMutation();
  const stopJob = trpc.scheduler.stopJob.useMutation();

  const handleStartScheduler = async () => {
    setIsStarting(true);
    try {
      await startScheduler.mutateAsync();
      toast({
        title: "Scheduler Started",
        description: "All automated jobs are now running",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scheduler",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopScheduler = async () => {
    setIsStopping(true);
    try {
      await stopScheduler.mutateAsync();
      toast({
        title: "Scheduler Stopped",
        description: "All automated jobs have been stopped",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop scheduler",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleTriggerJob = async (jobId: string, jobName: string) => {
    setTriggeringJob(jobId);
    try {
      await triggerJob.mutateAsync({ jobId });
      toast({
        title: "Job Triggered",
        description: `${jobName} is now running`,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to trigger ${jobName}`,
        variant: "destructive",
      });
    } finally {
      setTriggeringJob(null);
    }
  };

  const handleToggleJob = async (jobId: string, currentStatus: string) => {
    try {
      if (currentStatus === "running") {
        await stopJob.mutateAsync({ jobId });
        toast({ title: "Job Stopped" });
      } else {
        await startJob.mutateAsync({ jobId });
        toast({ title: "Job Started" });
      }
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle job status",
        variant: "destructive",
      });
    }
  };

  const getJobDescription = (jobId: string): string => {
    const descriptions: Record<string, string> = {
      "daily-discovery":
        "Scrapes all platforms daily to discover new co-founder prospects",
      "daily-campaigns":
        "Runs automated matching and outreach campaigns for all active users",
      "daily-followups":
        "Sends follow-up messages to prospects who haven't responded",
      "weekly-full-scrape":
        "Performs comprehensive weekly scrape of all platforms for maximum coverage",
    };
    return descriptions[jobId] || "Automated job";
  };

  const getJobIcon = (jobId: string) => {
    if (jobId.includes("discovery") || jobId.includes("scrape")) {
      return <RefreshCw className="h-5 w-5" />;
    }
    if (jobId.includes("campaign")) {
      return <CheckCircle2 className="h-5 w-5" />;
    }
    return <Clock className="h-5 w-5" />;
  };

  const allRunning = schedulerStatus?.every(
    (job: any) => job.status === "running"
  );
  const allStopped = schedulerStatus?.every(
    (job: any) => job.status === "stopped"
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Campaign Scheduler</h1>
        <p className="text-muted-foreground">
          Manage automated prospect discovery, matching, and outreach jobs
        </p>
      </div>

      {/* Global Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scheduler Controls</CardTitle>
          <CardDescription>
            Start or stop all automated jobs at once
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={handleStartScheduler}
            disabled={isStarting || allRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isStarting ? "Starting..." : "Start All Jobs"}
          </Button>
          <Button
            onClick={handleStopScheduler}
            disabled={isStopping || allStopped}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            {isStopping ? "Stopping..." : "Stop All Jobs"}
          </Button>
        </CardContent>
      </Card>

      {/* Job List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Scheduled Jobs</h2>

        {!schedulerStatus || schedulerStatus.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No scheduled jobs found. Click "Start All Jobs" to initialize the
              scheduler.
            </CardContent>
          </Card>
        ) : (
          schedulerStatus.map((job: any) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getJobIcon(job.id)}
                    <div>
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getJobDescription(job.id)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={job.status === "running" ? "default" : "secondary"}
                  >
                    {job.status === "running" ? (
                      <>
                        <Play className="h-3 w-3 mr-1" /> Running
                      </>
                    ) : (
                      <>
                        <Pause className="h-3 w-3 mr-1" /> Stopped
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Schedule
                    </div>
                    <div className="font-mono text-sm mt-1">{job.schedule}</div>
                  </div>
                  {job.lastRun && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Last Run
                      </div>
                      <div className="text-sm mt-1">
                        {new Date(job.lastRun).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {job.nextRun && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Next Run
                      </div>
                      <div className="text-sm mt-1">
                        {new Date(job.nextRun).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleJob(job.id, job.status)}
                  >
                    {job.status === "running" ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" /> Resume
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleTriggerJob(job.id, job.name)}
                    disabled={triggeringJob === job.id}
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${triggeringJob === job.id ? "animate-spin" : ""}`}
                    />
                    {triggeringJob === job.id ? "Running..." : "Run Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Section */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Daily Discovery:</strong> Automatically scrapes
            CoFoundersLab, FounderCloud, and Y Combinator every day at 2 AM to
            find new prospects.
          </p>
          <p>
            <strong>Daily Campaigns:</strong> Runs at 9 AM to match your profile
            with new prospects and generate personalized outreach messages.
          </p>
          <p>
            <strong>Daily Follow-ups:</strong> Sends follow-up messages at 3 PM
            to prospects who haven't responded after 3 days.
          </p>
          <p>
            <strong>Weekly Full Scrape:</strong> Performs a comprehensive scrape
            every Sunday at 1 AM to ensure maximum coverage across all
            platforms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
