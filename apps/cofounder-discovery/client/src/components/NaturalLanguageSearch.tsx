import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Search, Sparkles, Loader2, X } from "lucide-react";

interface SearchCriteria {
  skills?: string[];
  industries?: string[];
  location?: string;
  experienceLevel?: string;
  commitment?: string;
  fundingStage?: string;
  lookingFor?: string;
}

interface NaturalLanguageSearchProps {
  onSearch: (criteria: SearchCriteria) => void;
}

export function NaturalLanguageSearch({
  onSearch,
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("");
  const [parsedCriteria, setParsedCriteria] = useState<SearchCriteria | null>(
    null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  const parseMutation = trpc.nlSearch.parse.useMutation();
  const { data: suggestions } = trpc.nlSearch.suggest.useQuery(
    { partialQuery: query },
    { enabled: query.length >= 3 && showSuggestions }
  );

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const criteria = await parseMutation.mutateAsync({ query });
      setParsedCriteria(criteria);
      onSearch(criteria);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Failed to parse query:", error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Auto-search when clicking suggestion
    setTimeout(() => {
      parseMutation.mutateAsync({ query: suggestion }).then(criteria => {
        setParsedCriteria(criteria);
        onSearch(criteria);
      });
    }, 100);
  };

  const handleClear = () => {
    setQuery("");
    setParsedCriteria(null);
    onSearch({});
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Try: 'technical co-founder in SF with ML experience'"
              className="pl-10 pr-10"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || parseMutation.isPending}
          >
            {parseMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions &&
          suggestions?.suggestions &&
          suggestions.suggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-2 p-2">
              <div className="space-y-1">
                {suggestions.suggestions.map(
                  (suggestion: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-muted transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </Card>
          )}
      </div>

      {/* Parsed Criteria Display */}
      {parsedCriteria && Object.keys(parsedCriteria).length > 0 && (
        <Card className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-sm">Search Criteria</h4>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsedCriteria.skills?.map(skill => (
              <Badge key={skill} variant="secondary">
                Skill: {skill}
              </Badge>
            ))}
            {parsedCriteria.industries?.map(industry => (
              <Badge key={industry} variant="secondary">
                Industry: {industry}
              </Badge>
            ))}
            {parsedCriteria.location && (
              <Badge variant="secondary">
                Location: {parsedCriteria.location}
              </Badge>
            )}
            {parsedCriteria.experienceLevel && (
              <Badge variant="secondary">
                Experience: {parsedCriteria.experienceLevel}
              </Badge>
            )}
            {parsedCriteria.commitment && (
              <Badge variant="secondary">
                Commitment: {parsedCriteria.commitment}
              </Badge>
            )}
            {parsedCriteria.fundingStage && (
              <Badge variant="secondary">
                Stage: {parsedCriteria.fundingStage}
              </Badge>
            )}
            {parsedCriteria.lookingFor && (
              <Badge variant="secondary">
                Looking for: {parsedCriteria.lookingFor}
              </Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
