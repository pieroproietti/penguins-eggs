/**
 * Development workflow plugins — CI/CD, security, automation.
 */

export {
  generateWorkflows,
  ciWorkflow,
  releaseWorkflow,
  isoTestWorkflow,
} from '../../plugins/dev-workflow/ts-ci/workflows.js'

// verity-ops-pipeline — DevSecOps CI patterns (Vijay-Kishore-A/Project-VerityOps)
export { VerityOpsPipeline } from '../../plugins/dev-workflow/security-scan/verity-ops-pipeline.js'
export type {
  SecurityScanOptions,
  SbomResult,
  CveResult,
  TamperTestResult,
} from '../../plugins/dev-workflow/security-scan/verity-ops-pipeline.js'
