import { analyzeWithCopilot, analyzeWithHeuristics } from './copilot.js';
import type { FailureSummary } from './summarize.js';

export async function proposeRemediation(
  summary: FailureSummary,
): Promise<string> {
  // Try Copilot SDK first
  const copilotResult = await analyzeWithCopilot(summary.rawLogs);

  if (copilotResult) {
    return [
      `**Root Cause** (${copilotResult.confidence} confidence): ${copilotResult.rootCause}`,
      `**Suggested Fix**: ${copilotResult.suggestedFix}`,
      '',
      '> ⚠️ This is a **proposal only**. Review carefully before applying.',
    ].join('\n');
  }

  // Fallback to heuristic analysis
  const heuristic = analyzeWithHeuristics(summary.rawLogs);

  return [
    `**Root Cause** (${heuristic.confidence} confidence): ${heuristic.rootCause}`,
    `**Suggested Fix**: ${heuristic.suggestedFix}`,
    '',
    '> ℹ️ Analysis by pattern matching (Copilot SDK not available). Install `@github/copilot-sdk` for enhanced analysis.',
    '> ⚠️ This is a **proposal only**. Review carefully before applying.',
  ].join('\n');
}
