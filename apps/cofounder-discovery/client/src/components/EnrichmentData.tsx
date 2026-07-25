import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ChevronDown,
  ChevronUp,
  Linkedin,
  Github,
  Building2,
  ExternalLink,
  Star,
  GitFork,
  Users,
} from "lucide-react";

interface EnrichmentDataProps {
  enrichmentData?: {
    linkedin?: any;
    github?: any;
    company?: any;
  };
  enrichmentScore?: number;
}

export function EnrichmentData({
  enrichmentData,
  enrichmentScore,
}: EnrichmentDataProps) {
  const [expanded, setExpanded] = useState(false);

  if (!enrichmentData || enrichmentScore === 0) {
    return null;
  }

  const hasLinkedIn = enrichmentData.linkedin;
  const hasGitHub = enrichmentData.github;
  const hasCompany = enrichmentData.company;

  if (!hasLinkedIn && !hasGitHub && !hasCompany) {
    return null;
  }

  return (
    <div className="border-t border-white/10 pt-4 mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:bg-white/5"
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <Star className="w-4 h-4 text-blue-500" />
          View Enriched Profile Data
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* LinkedIn Data */}
          {hasLinkedIn && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Linkedin className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold">LinkedIn Profile</h4>
                {enrichmentData.linkedin.linkedInUrl && (
                  <a
                    href={enrichmentData.linkedin.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    View Profile <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {enrichmentData.linkedin.headline && (
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Headline:</span>{" "}
                  {enrichmentData.linkedin.headline}
                </p>
              )}

              {enrichmentData.linkedin.location && (
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Location:</span>{" "}
                  {enrichmentData.linkedin.location}
                </p>
              )}

              {enrichmentData.linkedin.currentPosition && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Current Position
                  </p>
                  <p className="text-sm font-medium">
                    {enrichmentData.linkedin.currentPosition.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {enrichmentData.linkedin.currentPosition.company} •{" "}
                    {enrichmentData.linkedin.currentPosition.duration}
                  </p>
                </div>
              )}

              {enrichmentData.linkedin.skills &&
                enrichmentData.linkedin.skills.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Top Skills
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {enrichmentData.linkedin.skills
                        .slice(0, 8)
                        .map((skill: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill.name}{" "}
                            {skill.endorsements > 0 &&
                              `(${skill.endorsements})`}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

              {enrichmentData.linkedin.summary && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Summary</p>
                  <p className="text-sm line-clamp-3">
                    {enrichmentData.linkedin.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* GitHub Data */}
          {hasGitHub && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Github className="w-5 h-5" />
                <h4 className="font-semibold">GitHub Profile</h4>
                {enrichmentData.github.githubUrl && (
                  <a
                    href={enrichmentData.github.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    View Profile <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {enrichmentData.github.bio && (
                <p className="text-sm mb-3">{enrichmentData.github.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-4 mb-3">
                {enrichmentData.github.publicRepos !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Repositories
                    </p>
                    <p className="text-lg font-semibold">
                      {enrichmentData.github.publicRepos}
                    </p>
                  </div>
                )}
                {enrichmentData.github.followers !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                    <p className="text-lg font-semibold">
                      {enrichmentData.github.followers}
                    </p>
                  </div>
                )}
                {enrichmentData.github.following !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Following</p>
                    <p className="text-lg font-semibold">
                      {enrichmentData.github.following}
                    </p>
                  </div>
                )}
              </div>

              {enrichmentData.github.topLanguages &&
                enrichmentData.github.topLanguages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Top Languages
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {enrichmentData.github.topLanguages.map(
                        (lang: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {lang}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {enrichmentData.github.topRepositories &&
                enrichmentData.github.topRepositories.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Top Repositories
                    </p>
                    <div className="space-y-2">
                      {enrichmentData.github.topRepositories
                        .slice(0, 3)
                        .map((repo: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <a
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium hover:underline flex items-center gap-1"
                              >
                                {repo.name}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              {repo.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {repo.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {repo.language && (
                                <Badge variant="outline" className="text-xs">
                                  {repo.language}
                                </Badge>
                              )}
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stars}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Company Data */}
          {hasCompany && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-purple-500" />
                <h4 className="font-semibold">Company Information</h4>
                {enrichmentData.company.website && (
                  <a
                    href={enrichmentData.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    Visit Website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {enrichmentData.company.name && (
                <p className="text-lg font-semibold mb-2">
                  {enrichmentData.company.name}
                </p>
              )}

              {enrichmentData.company.description && (
                <p className="text-sm mb-3 line-clamp-2">
                  {enrichmentData.company.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {enrichmentData.company.industry && (
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p>{enrichmentData.company.industry}</p>
                  </div>
                )}
                {enrichmentData.company.size && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Company Size
                    </p>
                    <p>{enrichmentData.company.size}</p>
                  </div>
                )}
                {enrichmentData.company.headquarters && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Headquarters
                    </p>
                    <p>{enrichmentData.company.headquarters}</p>
                  </div>
                )}
                {enrichmentData.company.employeeCount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Employees</p>
                    <p>
                      {enrichmentData.company.employeeCount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {enrichmentData.company.specialties &&
                enrichmentData.company.specialties.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Specialties
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {enrichmentData.company.specialties
                        .slice(0, 6)
                        .map((specialty: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {specialty}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
