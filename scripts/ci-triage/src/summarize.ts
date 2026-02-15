import { Octokit } from '@octokit/rest';

export interface FailedJob {
  name: string;
  conclusion: string;
  errorSnippet: string;
}

export interface FailureSummary {
  runId: number;
  summary: string;
  failedJobs: FailedJob[];
  rawLogs: string;
}

interface SummarizeOptions {
  runId: number;
  owner: string;
  repo: string;
  token: string;
}

export async function summarizeFailure(
  options: SummarizeOptions,
): Promise<FailureSummary> {
  const octokit = new Octokit({ auth: options.token });

  // Get workflow run details
  const { data: run } = await octokit.actions.getWorkflowRun({
    owner: options.owner,
    repo: options.repo,
    run_id: options.runId,
  });

  // Get jobs for this run
  const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
    owner: options.owner,
    repo: options.repo,
    run_id: options.runId,
    filter: 'latest',
  });

  const failedJobs: FailedJob[] = [];
  let rawLogs = '';

  for (const job of jobsData.jobs) {
    if (job.conclusion === 'failure') {
      // Get job logs
      let logContent = '';
      try {
        const { data } = await octokit.actions.downloadJobLogsForWorkflowRun({
          owner: options.owner,
          repo: options.repo,
          job_id: job.id,
        });
        logContent = typeof data === 'string' ? data : String(data);
      } catch {
        logContent = '(logs unavailable)';
      }

      // Extract last 50 lines as error snippet
      const logLines = logContent.split('\n');
      const errorSnippet = logLines.slice(-50).join('\n');

      failedJobs.push({
        name: job.name,
        conclusion: job.conclusion ?? 'failure',
        errorSnippet,
      });

      rawLogs += `\n--- ${job.name} ---\n${logContent}`;
    }
  }

  const summary = `Workflow **${run.name ?? 'unknown'}** (run #${options.runId}) failed with ${failedJobs.length} failed job(s).`;

  return { runId: options.runId, summary, failedJobs, rawLogs };
}
