/**
 * Engine module: myclaw-integrated agentic execution for eggs-ai.
 */

export { runAgentLoop, resumeSession, resumeLatestSession, sessionStore } from './agent-loop.js';
export type { AgentEvent, AgentLoopOptions } from './agent-loop.js';
export { InMemoryEventBus } from './event-bus.js';
export type { EventBus, EventHandler } from './event-bus.js';
export { SessionStore, compressContext } from './session-store.js';
export type { AgentSession, SessionSummaryBlock } from './session-store.js';
export { checkGate } from './check-gate.js';
export type { CheckFailure, ApprovalCallback } from './check-gate.js';
export { ALL_TOOLS } from './tool-definitions.js';
export type { ToolDefinition } from './tool-definitions.js';
export { executeTool } from './tool-executor.js';
export type { ToolResult } from './tool-executor.js';
export { readUserProfile, updateUserProfile, loadProfileBrief } from './user-profile.js';
export type { EggsUserProfile } from './user-profile.js';
export { getEggsToolsForMyclaw, executeEggsToolForMyclaw, wrapEggsProviderForMyclaw, createMyclawProvider, listAvailableProviders } from './myclaw-bridge.js';
export type { MyclawToolDefinition, MyclawLLMProvider } from './myclaw-bridge.js';
export { SessionLogSubscriber } from './subscribers/session-log-subscriber.js';
export { MetricsSubscriber } from './subscribers/metrics-subscriber.js';
