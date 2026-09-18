const BRANCH_PATTERN =
  /^(feat|fix|refactor|perf|test|docs|chore|ci|build|spike|release|codex)\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const DEPENDABOT_BRANCH_PATTERN =
  /^dependabot\/(npm_and_yarn|github_actions)\/[a-z0-9][a-z0-9._/-]*$/;
const TITLE_PATTERN =
  /^(feat|fix|refactor|perf|test|docs|chore|ci|build|revert)(\([a-z0-9._/-]+\))?!?: [^\s].+$/;
const REQUIRED_SECTIONS = [
  "Why",
  "What changed",
  "Validation",
  "Risk and rollback",
];
const IDEAL_LINES = 400;
const IDEAL_FILES = 15;
const LARGE_LINES = 1200;
const LARGE_FILES = 35;
const LARGE_PR_LABEL = "large-pr-approved";

const stripComments = (value) =>
  value.replaceAll(/<!--[\s\S]*?-->/g, "").trim();

const sectionContent = (body, heading) => {
  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  const index = headings.findIndex(
    (match) => match[1].trim().toLowerCase() === heading.toLowerCase(),
  );
  if (index < 0) return "";
  const start = headings[index].index + headings[index][0].length;
  const end = headings[index + 1]?.index ?? body.length;
  return stripComments(body.slice(start, end));
};

const isMechanicalLineChurn = (path) =>
  path === "pnpm-lock.yaml" || path === "tooling/eas/pnpm-lock.yaml";

export function summarizeDiff(entries) {
  let reviewableLines = 0;
  let reviewableFiles = 0;
  let binaryFiles = 0;
  let mechanicalFiles = 0;
  for (const entry of entries) {
    if (isMechanicalLineChurn(entry.path)) {
      mechanicalFiles += 1;
      continue;
    }
    reviewableFiles += 1;
    if (entry.binary) binaryFiles += 1;
    else reviewableLines += entry.additions + entry.deletions;
  }
  return { reviewableLines, reviewableFiles, binaryFiles, mechanicalFiles };
}

export function validatePullRequestPolicy({
  branch,
  title,
  body,
  labels = [],
  diffEntries = [],
}) {
  const errors = [];
  const warnings = [];
  const managedDependabotBranch = DEPENDABOT_BRANCH_PATTERN.test(branch);
  if (
    (!BRANCH_PATTERN.test(branch) && !managedDependabotBranch) ||
    (!managedDependabotBranch && branch.length > 80)
  ) {
    errors.push(
      `Branch '${branch}' does not follow <type>/<short-kebab-slug> or exceeds 80 characters.`,
    );
  }
  if (!TITLE_PATTERN.test(title) || /^(draft|wip)\b/i.test(title)) {
    errors.push(
      `PR title '${title}' must use Conventional Commits, for example feat(player): add sleep timer.`,
    );
  }
  for (const heading of REQUIRED_SECTIONS) {
    if (!sectionContent(body, heading)) {
      errors.push(`PR body section '## ${heading}' is missing or empty.`);
    }
  }
  const size = summarizeDiff(diffEntries);
  if (
    size.reviewableLines > IDEAL_LINES ||
    size.reviewableFiles > IDEAL_FILES
  ) {
    warnings.push(
      `PR exceeds the review target (${size.reviewableLines} lines, ${size.reviewableFiles} files; target <= ${IDEAL_LINES} lines and <= ${IDEAL_FILES} files).`,
    );
  }
  const isLarge =
    size.reviewableLines > LARGE_LINES || size.reviewableFiles > LARGE_FILES;
  if (isLarge && !labels.includes(LARGE_PR_LABEL)) {
    errors.push(
      `Large PR requires maintainer label '${LARGE_PR_LABEL}' after a documented split review (>${LARGE_LINES} lines or >${LARGE_FILES} files).`,
    );
  }
  return {
    errors,
    warnings,
    size,
    thresholds: {
      idealLines: IDEAL_LINES,
      idealFiles: IDEAL_FILES,
      largeLines: LARGE_LINES,
      largeFiles: LARGE_FILES,
      overrideLabel: LARGE_PR_LABEL,
    },
  };
}
