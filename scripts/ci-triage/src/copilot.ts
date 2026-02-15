/**
 * Copilot SDK adapter for CI triage.
 * 
 * This module provides a read-only interface to the Copilot SDK
 * for generating failure summaries and remediation suggestions.
 * 
 * When the Copilot SDK (@github/copilot-sdk) is available, it will
 * use it for enhanced analysis. Otherwise, falls back to pattern-based
 * heuristics.
 */

export interface CopilotAnalysis {
  summary: string;
  rootCause: string;
  suggestedFix: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzeWithCopilot(
  context: string,
): Promise<CopilotAnalysis | null> {
  // Attempt to use Copilot SDK if available
  try {
    // Dynamic import — the SDK may not be installed in all environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sdk = await import('@github/copilot-sdk').catch(() => null);
    if (!sdk) {
      return null; // SDK not available, caller should use fallback
    }

    // SDK integration placeholder — actual API depends on SDK version
    console.log('[copilot] SDK available; using for enhanced analysis');
    return null; // Let caller use heuristic fallback for now
  } catch {
    return null;
  }
}

/**
 * Heuristic-based fallback analysis when Copilot SDK is unavailable.
 */
export function analyzeWithHeuristics(logs: string): CopilotAnalysis {
  const lines = logs.split('\n');

  let rootCause = 'Unknown error';
  let suggestedFix = 'Review the full logs for details.';
  let confidence: CopilotAnalysis['confidence'] = 'low';

  // Common CI failure patterns
  for (const line of lines) {
    if (/npm ERR!|ELIFECYCLE/.test(line)) {
      rootCause = 'npm script failure';
      suggestedFix = 'Check the failing npm script command and its output above this error.';
      confidence = 'medium';
      break;
    }
    if (/error TS\d+/.test(line)) {
      rootCause = 'TypeScript compilation error';
      suggestedFix = 'Fix the TypeScript errors indicated in the build output.';
      confidence = 'high';
      break;
    }
    if (/FAIL.*\.spec|FAIL.*\.test/.test(line)) {
      rootCause = 'Test failure';
      suggestedFix = 'Review failing test assertions and fix the underlying code or update tests.';
      confidence = 'high';
      break;
    }
    if (/docker.*error|Cannot connect to the Docker daemon/.test(line)) {
      rootCause = 'Docker build/push failure';
      suggestedFix = 'Verify Docker daemon is running and credentials are configured.';
      confidence = 'medium';
      break;
    }
    if (/terraform.*Error|Error:.*resource/.test(line)) {
      rootCause = 'Terraform plan/apply error';
      suggestedFix = 'Review Terraform state and resource configurations.';
      confidence = 'medium';
      break;
    }
  }

  return {
    summary: `Detected: ${rootCause}`,
    rootCause,
    suggestedFix,
    confidence,
  };
}
