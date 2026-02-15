import { summarizeFailure } from './summarize.js';
import { proposeRemediation } from './remediate.js';

export interface TriageOptions {
  runId: number;
  owner: string;
  repo: string;
  token: string;
  enableRemediation?: boolean;
}

export async function triageCIFailure(options: TriageOptions): Promise<string> {
  const summary = await summarizeFailure({
    runId: options.runId,
    owner: options.owner,
    repo: options.repo,
    token: options.token,
  });

  let output = `## CI Failure Triage\n\n${summary.summary}\n\n### Failed Jobs\n`;
  for (const job of summary.failedJobs) {
    output += `- **${job.name}**: ${job.conclusion} — ${job.errorSnippet}\n`;
  }

  if (options.enableRemediation) {
    const remediation = await proposeRemediation(summary);
    output += `\n### Proposed Remediation\n${remediation}`;
  } else {
    output += '\n> Remediation proposals disabled. Set `enable-remediation: true` to enable.';
  }

  return output;
}

// CLI entry when run directly
if (process.argv[1]?.endsWith('index.js')) {
  const runId = Number(process.env.GITHUB_RUN_ID ?? '0');
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '/').split('/');
  const token = process.env.GITHUB_TOKEN ?? '';

  if (!runId || !owner || !repo || !token) {
    console.error('Missing required env: GITHUB_RUN_ID, GITHUB_REPOSITORY, GITHUB_TOKEN');
    process.exit(1);
  }

  triageCIFailure({
    runId,
    owner,
    repo,
    token,
    enableRemediation: process.env.ENABLE_REMEDIATION === 'true',
  })
    .then((output) => console.log(output))
    .catch((err) => {
      console.error('Triage failed:', err);
      process.exit(1);
    });
}
