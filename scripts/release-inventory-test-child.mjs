import { runInventory, inspectRelease } from "./release-inventory.mjs";

const [baseline, root] = process.argv.slice(2);
const fakeGit = (_command, args) =>
  args.includes("rev-parse") ? "a".repeat(40) : " M package.json\n";
const result = runInventory(["--compare", baseline], root, (base) =>
  inspectRelease(base, fakeGit),
);
process.stdout.write(result.output);
process.exitCode = result.code;
