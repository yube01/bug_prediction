/**
 * Patch Analysis — Extract real complexity and method counts from GitHub diff patches
 * 
 * This replaces the crude proxy (`files × 0.8`) with actual analysis of the
 * diff content that GitHub returns with each commit. This is critical because
 * ~36% of the model's SHAP importance comes from complexity-related features.
 * 
 * We count decision points (if/for/while/catch/&&/||) and function definitions
 * in ADDED lines only (lines starting with `+` in the unified diff).
 */

// Only match lines added in the diff (start with + but not +++)
const ADDED_LINE_RE = /^\+(?!\+\+)/

// ── Decision point patterns (Python + TypeScript/JavaScript) ────────────────
// These increase cyclomatic complexity by adding execution paths
const DECISION_KW_RE  = /\b(if|elif|else\s+if|for|while|except|catch|switch|case|assert|do)\b/g
const LOGICAL_OP_RE   = /(\&\&|\|\||\?\?|\band\b|\bor\b)/g
const TERNARY_RE      = /[^?]\?[^?:]+:/g  // ternary ? : (not ?. or ??)

// ── Function/method definition patterns ─────────────────────────────────────
const PYTHON_DEF_RE   = /\bdef\s+\w+/g
const PYTHON_CLASS_RE = /\bclass\s+\w+/g
const JS_FUNC_RE      = /\bfunction\s*[\w*(]/g
const JS_CLASS_RE     = /\bclass\s+\w/g
const ARROW_FUNC_RE   = /\)\s*(?::\s*\w[\w<>[\]|&, ]*\s*)?=>\s*[{(]/g  // ) => { or ): Type => {

export interface PatchAnalysis {
  /** Average cyclomatic complexity per method/function */
  avgComplexity: number
  /** Number of functions/methods defined in added lines */
  numMethods: number
  /** Total decision points found in added lines */
  totalDecisions: number
  /** Total lines added across all patches */
  addedLines: number
}

/**
 * Analyze patch content from GitHub commit files to extract real
 * complexity metrics instead of using crude file-count proxies.
 * 
 * This parses the unified diff format that GitHub returns:
 *   @@ -10,5 +10,6 @@
 *    unchanged line
 *   +added line        ← we analyze these
 *   -removed line
 *   +another added line ← and these
 */
export function analyzePatch(files: { patch?: string }[]): PatchAnalysis {
  let totalDecisions = 0
  let totalMethods = 0
  let totalAddedLines = 0

  for (const file of files) {
    const patch = file.patch
    if (!patch) continue

    const lines = patch.split('\n')

    for (const line of lines) {
      // Only analyze added lines (lines starting with +, not +++)
      if (!ADDED_LINE_RE.test(line)) continue
      totalAddedLines++

      // Skip comment lines (rough heuristic — works for Python/JS/TS)
      const trimmed = line.slice(1).trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('#') ||
          trimmed.startsWith('*') || trimmed.startsWith('/*') ||
          trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        continue
      }

      // Count decision points
      const decisions = (line.match(DECISION_KW_RE) ?? []).length
      const logicOps  = (line.match(LOGICAL_OP_RE) ?? []).length
      const ternaries = (line.match(TERNARY_RE) ?? []).length
      totalDecisions += decisions + logicOps + ternaries

      // Count function/method definitions
      totalMethods += (line.match(PYTHON_DEF_RE) ?? []).length
      totalMethods += (line.match(PYTHON_CLASS_RE) ?? []).length
      totalMethods += (line.match(JS_FUNC_RE) ?? []).length
      totalMethods += (line.match(JS_CLASS_RE) ?? []).length
      totalMethods += (line.match(ARROW_FUNC_RE) ?? []).length
    }
  }

  // Compute average complexity:
  //  - Base complexity = 1 (every function has at least 1 path)
  //  - Add decision points / number of methods
  //  - If no methods detected, use 1 as denominator (treat whole diff as one unit)
  const denominator = Math.max(totalMethods, 1)
  const avgComplexity = totalAddedLines === 0
    ? 1
    : Math.max(1, 1 + totalDecisions / denominator)

  return {
    avgComplexity: Number(avgComplexity.toFixed(2)),
    numMethods: totalMethods,
    totalDecisions,
    addedLines: totalAddedLines,
  }
}
