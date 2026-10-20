import { readFileSync } from "node:fs";

const workflowPath = new URL("../.github/workflows/ci.yml", import.meta.url);
export function getCiMysqlImage(workflow = readFileSync(workflowPath, "utf8")) {
  const image = workflow.match(/^\s+mysql:\r?\n\s+image:\s*(\S+)\s*$/m)?.[1];
  if (!image) throw new Error("CI MySQL service image missing");
  return image;
}
