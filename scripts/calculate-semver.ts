/**
 * Calcula próxima versão semver a partir de commits convencionais
 * desde a última tag em main.
 *
 * Uso: npx tsx scripts/calculate-semver.ts [ref-base]
 * Saída JSON em stdout.
 */
import { execSync } from 'child_process';

type Bump = 'major' | 'minor' | 'patch' | 'none';

interface SemverResult {
  currentVersion: string;
  nextVersion: string;
  bump: Bump;
  releasable: boolean;
  commitCount: number;
  highlights: string[];
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function runExitOk(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function parseVersion(tag: string): [number, number, number] {
  const clean = tag.replace(/^v/, '');
  const [major, minor, patch] = clean.split('.').map((n) => parseInt(n, 10) || 0);
  return [major, minor, patch];
}

function bumpVersion(version: string, bump: Bump): string {
  const [major, minor, patch] = parseVersion(version);
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}

function analyzeCommits(messages: string[]): { bump: Bump; highlights: string[] } {
  let bump: Bump = 'none';
  const highlights: string[] = [];

  for (const message of messages) {
    const firstLine = message.split('\n')[0] ?? '';
    const breaking =
      message.includes('BREAKING CHANGE') || /^(\w+)(\(.*\))?!:/.test(firstLine);
    const typeMatch = firstLine.match(/^(\w+)(?:\(.*\))?!?:\s*(.+)/);

    if (breaking) {
      bump = 'major';
      highlights.push(firstLine);
      continue;
    }

    if (!typeMatch) continue;
    const [, type, description] = typeMatch;

    if (type === 'feat' && bump !== 'major') {
      bump = 'minor';
      highlights.push(`feat: ${description}`);
    } else if (['fix', 'perf'].includes(type) && bump === 'none') {
      bump = 'patch';
      highlights.push(`${type}: ${description}`);
    }
  }

  return { bump, highlights: highlights.slice(0, 10) };
}

function main(): SemverResult {
  const developRef = process.env.DEVELOP_REF ?? 'origin/develop';
  const mainRef = process.env.MAIN_REF ?? 'origin/main';

  let currentTag = 'v0.0.0';
  let described: string | null = null;
  try {
    described = run(`git describe --tags ${mainRef} --abbrev=0`);
    currentTag = described;
  } catch {
    // sem tags ainda
  }

  const currentVersion = currentTag.replace(/^v/, '');

  let logRange = `${mainRef}..${developRef}`;
  if (described && runExitOk(`git merge-base --is-ancestor ${currentTag} ${developRef}`)) {
    logRange = `${currentTag}..${developRef}`;
  }

  let commits: string[] = [];
  try {
    const raw = run(`git log ${logRange} --pretty=format:%s%n%b`);
    commits = raw ? raw.split('\n\n').filter(Boolean) : [];
  } catch {
    commits = [];
  }

  const subjectLines = commits.map((c) => c.split('\n')[0]).filter(Boolean);
  const { bump, highlights } = analyzeCommits(commits);

  let nextBump = bump;
  if (currentTag === 'v0.0.0' && bump !== 'none' && bump !== 'major') {
    // Primeira release de produção → 1.0.0
    nextBump = bump === 'minor' || bump === 'patch' ? 'minor' : bump;
  }

  let nextVersion = bumpVersion(currentVersion, nextBump);
  if (currentTag === 'v0.0.0' && nextBump === 'minor') {
    nextVersion = '1.0.0';
  }

  const releasable = nextBump !== 'none' && subjectLines.length > 0;

  const result: SemverResult = {
    currentVersion,
    nextVersion,
    bump: nextBump,
    releasable,
    commitCount: subjectLines.length,
    highlights,
  };

  console.log(JSON.stringify(result));
  return result;
}

main();
