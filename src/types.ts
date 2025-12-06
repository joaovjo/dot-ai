export interface MCPConfig {
  mcpServers: Record<string, MCPServer>;
}

export interface MCPServer {
  type?: "stdio" | "sse";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface RuleFile {
  frontmatter: Record<string, unknown>;
  content: string;
  filename: string;
}

export interface AIConfig {
  instructions: string;
  rules: RuleFile[];
  commands: RuleFile[]; // Changed to support frontmatter like rules
  mcp: MCPConfig;
}

export interface GeminiSettings {
  mcpServers?: Record<string, MCPServer>;
  [key: string]: unknown;
}

export interface OpenCodeMCPServer {
  type: "local" | "remote";
  command?: string[];
  url?: string;
  environment?: Record<string, string>;
}

export interface OpenCodeConfig {
  mcp?: Record<string, OpenCodeMCPServer>;
  [key: string]: unknown;
}

// New provider-specific configurations
export interface WindsurfConfig {
  memories?: Record<string, unknown>;
  mcp?: MCPConfig;
}

export interface QoderConfig {
  questMode?: Record<string, unknown>;
  mcp?: MCPConfig;
}

export interface TraeConfig {
  agents?: Record<string, unknown>;
}

export interface JulesConfig {
  agents?: string; // AGENTS.md content
}

export interface QwenCodeConfig {
  commands?: Record<string, string>;
}

export interface GeminiCLIConfig {
  commands?: Record<string, string>;
  mcp?: MCPConfig;
}

export interface CopilotCLIConfig {
  agents?: Record<string, string>; // ~/.copilot/agents/
  repoAgents?: Record<string, string>; // .github/agents/
  mcp?: MCPConfig;
}

export interface KiroConfig {
  specs?: Record<string, string>;
  hooks?: Record<string, string>;
  steering?: Record<string, string>;
  mcp?: MCPConfig;
}

export interface VSCodeCopilotConfig {
  instructions?: Record<string, string>; // .github/copilot-instructions.md (glob pattern support)
  prompts?: Record<string, string>; // .github/copilot-prompts/
  agents?: Record<string, string>; // .github/agents/
}

export interface AntigravityConfig {
  globalRules?: string; // ~/.gemini/GEMINI.md
  rules?: Record<string, string>; // .agent/rules/
  workflows?: Record<string, string>; // .agent/workflows/
  mcp?: MCPConfig;
}

export interface DropstoneConfig {
  workflows?: Record<string, string>;
}

export interface GeneratedFiles {
  "CLAUDE.md": string;
  "GEMINI.md": string;
  "AGENTS.md": string;
  "WINDSURF.md": string;
  "QODER.md": string;
  "TRAE.md": string;
  "JULES.md": string;
  "QWEN.md": string;
  ".mcp.json": string;
  ".cursor/rules": Record<string, string>;
  ".gemini/settings.json": string;
  "opencode.json": string;
  ".copilot/agents": Record<string, string>;
  ".kiro/specs": Record<string, string>;
  ".kiro/hooks": Record<string, string>;
  ".kiro/steering": Record<string, string>;
  ".kiro/mcp.json": string;
  ".github/copilot-instructions.md": string;
  ".github/copilot-prompts": Record<string, string>;
  ".github/agents": Record<string, string>;
  ".agent/rules": Record<string, string>;
  ".agent/workflows": Record<string, string>;
  ".dropstone/workflows": Record<string, string>;
}

export interface DetectedFiles {
  // Existing providers
  claude?: string;
  gemini?: string;
  agents?: string;
  mcp?: string;
  cursorRules: string[];
  claudeCommands: string[];
  geminiSettings?: string;
  opencode?: string;

  // New providers
  windsurf?: string;
  windsurfMemories: string[];
  qoder?: string;
  trae?: string;
  traeAgents: string[];
  jules?: string;
  qwen?: string;
  qwenCommands: string[];
  geminiCLI?: string;
  geminiCLICommands: string[];
  copilotAgents: string[];
  copilotRepoAgents: string[];
  copilotMCP?: string;
  kiroSpecs: string[];
  kiroHooks: string[];
  kiroSteering: string[];
  kiroMCP?: string;
  vscodeCopilotInstructions: string[];
  vscodeCopilotPrompts: string[];
  vscodeCopilotAgents: string[];
  antigravityGlobal?: string;
  antigravityRules: string[];
  antigravityWorkflows: string[];
  dropstoneWorkflows: string[];
}
