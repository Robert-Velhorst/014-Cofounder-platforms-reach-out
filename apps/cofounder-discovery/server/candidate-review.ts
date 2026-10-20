import { createHash } from "node:crypto";
import { prospects, type Prospect } from "../drizzle/schema";

/** The same projection is read for review and under the mutation lock. */
export const candidateReviewProjection = {
  id: prospects.id,
  userId: prospects.userId,
  name: prospects.name,
  title: prospects.title,
  location: prospects.location,
  bio: prospects.bio,
  skills: prospects.skills,
  experience: prospects.experience,
  industries: prospects.industries,
  currentCompany: prospects.currentCompany,
  lookingFor: prospects.lookingFor,
  startupStage: prospects.startupStage,
  platform: prospects.platform,
  profileUrl: prospects.profileUrl,
  sourceKind: prospects.sourceKind,
  consentStatus: prospects.consentStatus,
  importProvenance: prospects.importProvenance,
  importedAt: prospects.importedAt,
  lastUpdated: prospects.lastUpdated,
  archivedAt: prospects.archivedAt,
};
type ReviewedCandidate = Pick<Prospect, keyof typeof candidateReviewProjection>;
// Lists need profile/source context, not unvalidated provenance. Details parses it.
const { importProvenance: _provenance, ...listProjection } =
  candidateReviewProjection;
export const candidateListProjection = listProjection;

// Content, not a second-precision timestamp, detects legacy writers and quick edits.
// Select keys explicitly so row property order never changes the review token.
export function candidateRevision(row: ReviewedCandidate): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        Object.keys(candidateReviewProjection).map(key => [
          key,
          row[key as keyof ReviewedCandidate],
        ])
      )
    )
    .digest("hex");
}
