import { HelpCircle, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";

interface TutorialTooltipProps {
  videoUrl: string;
  title: string;
  description?: string;
}

export function TutorialTooltip({
  videoUrl,
  title,
  description,
}: TutorialTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle hover with delay
  const handleMouseEnter = () => {
    setIsHovering(true);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 500); // 500ms delay before showing
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Keep open briefly to allow moving to popup
    setTimeout(() => {
      if (!isHovering) {
        setIsOpen(false);
      }
    }, 200);
  };

  // Auto-play video when popup opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-block">
      {/* Help Icon */}
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
        aria-label={`Tutorial: ${title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Video Popup */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={handleMouseLeave}
        >
          <Card className="w-[400px] max-w-[90vw] shadow-xl border-2">
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
                aria-label="Close tutorial"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Video */}
              <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  loop
                  muted
                  className="w-full h-full"
                  playsInline
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold mb-1">{title}</h3>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Inline version for use within headings
 */
export function InlineTutorial({
  videoUrl,
  title,
  description,
}: TutorialTooltipProps) {
  return (
    <span className="inline-flex items-center">
      <TutorialTooltip
        videoUrl={videoUrl}
        title={title}
        description={description}
      />
    </span>
  );
}
