import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Rocket,
  Users,
  MessageSquare,
  Target,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const guides = [
    {
      icon: Rocket,
      title: "Getting Started",
      description:
        "Learn how to set up your profile and find your first co-founder",
      color: "orange",
      steps: [
        "Complete the 5-step onboarding to create your profile",
        "Add your skills, industries, and what you're looking for",
        "Click 'Start Discovery' to find compatible matches",
        "Review your matches and start conversations",
      ],
    },
    {
      icon: Users,
      title: "Understanding Matches",
      description: "How our AI-powered matching algorithm works",
      color: "blue",
      steps: [
        "We analyze 6 dimensions: skills, experience, goals, personality, location, and availability",
        "Each match gets a compatibility score (0-100%)",
        "Higher scores mean better alignment across all dimensions",
        "Review the detailed breakdown to understand why you matched",
      ],
    },
    {
      icon: MessageSquare,
      title: "Messaging Co-Founders",
      description: "Best practices for reaching out to potential partners",
      color: "purple",
      steps: [
        "Use our AI message generator for personalized introductions",
        "Be specific about what you're building and why you're reaching out",
        "Highlight complementary skills and shared interests",
        "Suggest a specific next step (call, coffee, etc.)",
      ],
    },
    {
      icon: Target,
      title: "Campaign Automation",
      description: "Set up automated outreach sequences",
      color: "green",
      steps: [
        "Create a campaign with your target criteria",
        "Design a multi-step sequence with follow-ups",
        "Set timing delays between messages",
        "Track performance and optimize based on response rates",
      ],
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your progress and optimize your approach",
      color: "pink",
      steps: [
        "Monitor match quality trends over time",
        "Track message response rates",
        "Analyze which approaches work best",
        "Export data for deeper analysis",
      ],
    },
  ];

  const faqs = [
    {
      question: "How does the AI matching work?",
      answer:
        "Our AI analyzes your profile across 6 key dimensions: technical skills, experience level, startup goals, personality traits, location preferences, and availability. It then compares these against thousands of potential co-founders to find the best matches. The algorithm learns from successful partnerships to improve recommendations over time.",
    },
    {
      question: "What platforms do you search?",
      answer:
        "We integrate with CoFoundersLab, FounderCloud (formerly StartHawk), and Y Combinator's co-founder matching. This gives you access to the largest pool of potential co-founders across multiple platforms without needing separate accounts.",
    },
    {
      question: "How long does it take to find matches?",
      answer:
        "Initial matches appear within 30 seconds of completing your profile. The AI continues to find new matches as more people join the platform and as you refine your preferences. Most users find 5-10 high-quality matches in their first week.",
    },
    {
      question: "Is my data private and secure?",
      answer:
        "Yes. We use industry-standard encryption for all data. Your profile is only visible to potential matches, and you control who can message you. We never sell your data to third parties. You can delete your account and all data at any time from Settings.",
    },
    {
      question: "What if I don't like my matches?",
      answer:
        "You can update your profile preferences at any time to get better matches. The AI learns from your interactions - when you message certain matches or skip others, it refines future recommendations. You can also provide direct feedback on match quality.",
    },
    {
      question: "Can I search for co-founders manually?",
      answer:
        "The platform is designed for AI-powered matching rather than manual searching. This ensures you see the most compatible matches based on deep compatibility analysis, not just keywords. However, you can refine your preferences in Settings to guide the AI toward specific types of co-founders.",
    },
    {
      question: "How much does it cost?",
      answer:
        "We offer a free tier with basic matching and messaging. Premium plans include unlimited matches, advanced analytics, campaign automation, and priority support. Check our pricing page for current rates and features.",
    },
    {
      question: "What makes a good co-founder match?",
      answer:
        "The best matches have complementary skills (not identical), aligned vision and values, compatible work styles, and mutual respect. Our AI looks for these factors, but ultimately you need to have conversations to assess chemistry and commitment level.",
    },
  ];

  const videos = [
    { title: "Platform Overview (3:24)", thumbnail: "🎬", duration: "3:24" },
    {
      title: "Creating Your Profile (2:15)",
      thumbnail: "👤",
      duration: "2:15",
    },
    {
      title: "Understanding Match Scores (4:10)",
      thumbnail: "📊",
      duration: "4:10",
    },
    {
      title: "Messaging Best Practices (5:30)",
      thumbnail: "💬",
      duration: "5:30",
    },
    { title: "Setting Up Campaigns (6:45)", thumbnail: "🎯", duration: "6:45" },
  ];

  const filteredFaqs = faqs.filter(
    faq =>
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 mb-4">
          <HelpCircle className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Help Center</h1>
        <p className="text-gray-400 text-lg">
          Everything you need to find your perfect co-founder
        </p>
      </div>

      {/* Search */}
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm mb-8 max-w-2xl mx-auto">
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="pl-10 bg-gray-800/50 border-white/10 text-white"
            />
          </div>
        </div>
      </Card>

      {/* Getting Started Guides */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">
            Getting Started Guides
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <Card
                key={index}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm hover:border-orange-500/30 transition-all"
              >
                <div className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${guide.color}-500/20 to-${guide.color}-600/20 border border-${guide.color}-500/30 flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-6 h-6 text-${guide.color}-400`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {guide.description}
                  </p>
                  <ol className="space-y-2">
                    {guide.steps.map((step, stepIndex) => (
                      <li
                        key={stepIndex}
                        className="text-sm text-gray-300 flex gap-2"
                      >
                        <span className="text-orange-500 font-bold">
                          {stepIndex + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Play className="w-6 h-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-white">Video Tutorials</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="p-6">
                <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:border-purple-500/50 transition-all">
                  <div className="text-6xl">{video.thumbnail}</div>
                  <div className="absolute">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-white/20 transition-all">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-400">{video.duration}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <Card
                key={index}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contact Support */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-orange-500/30 backdrop-blur-sm mt-12 max-w-2xl mx-auto">
        <div className="p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Still need help?
          </h3>
          <p className="text-gray-300 mb-4">
            Our support team is here to assist you
          </p>
          <a
            href="mailto:support@cofounderdiscovery.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 text-white font-medium hover:from-orange-600 hover:to-purple-700 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            Contact Support
          </a>
        </div>
      </Card>
    </div>
  );
}
