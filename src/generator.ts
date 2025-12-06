import { mkdir, stat } from "fs/promises";
import type {
  AIConfig,
  GeminiSettings,
  GeneratedFiles,
  MCPConfig,
  OpenCodeConfig,
  OpenCodeMCPServer,
  RuleFile,
} from "./types.ts";

export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function readAIConfig(aiDir = ".ai"): Promise<AIConfig> {
  // Read instructions
  const instructionsPath = `${aiDir}/instructions.md`;
  let instructions = "";
  try {
    const instructionsFile = Bun.file(instructionsPath);
    if (await instructionsFile.exists()) {
      instructions = await instructionsFile.text();
    }
  } catch {
    console.warn(`Could not read instructions from ${instructionsPath}`);
  }

  // Read rules
  const rules: RuleFile[] = [];
  const rulesDir = `${aiDir}/rules`;
  if (await directoryExists(rulesDir)) {
    try {
      const glob = new Bun.Glob("*.md");
      for await (const file of glob.scan({ cwd: rulesDir })) {
        const filePath = `${rulesDir}/${file}`;
        const content = await Bun.file(filePath).text();
        const { frontmatter, content: ruleContent } = parseFrontmatter(content);
        rules.push({
          frontmatter,
          content: ruleContent,
          filename: file,
        });
      }
    } catch {
      console.warn(`Could not read rules from ${aiDir}/rules`);
    }
  }

  // Read commands (now with frontmatter support)
  const commands: RuleFile[] = [];
  const commandsDir = `${aiDir}/commands`;
  if (await directoryExists(commandsDir)) {
    try {
      const glob = new Bun.Glob("*.md");
      for await (const file of glob.scan({ cwd: commandsDir })) {
        const filePath = `${commandsDir}/${file}`;
        const content = await Bun.file(filePath).text();
        const { frontmatter, content: commandContent } =
          parseFrontmatter(content);
        commands.push({
          frontmatter,
          content: commandContent,
          filename: file,
        });
      }
    } catch {
      console.warn(`Could not read commands from ${aiDir}/commands`);
    }
  }

  // Read MCP config
  let mcp: MCPConfig = { mcpServers: {} };
  try {
    const mcpPath = `${aiDir}/mcp.json`;
    const mcpFile = Bun.file(mcpPath);
    if (await mcpFile.exists()) {
      mcp = await mcpFile.json();
    }
  } catch {
    console.warn(`Could not read MCP config from ${aiDir}/mcp.json`);
  }

  return {
    instructions,
    rules,
    commands,
    mcp,
  };
}

export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  // Handle both empty and non-empty frontmatter
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

  // Special case for empty frontmatter (--- immediately followed by ---)
  const emptyFrontmatterRegex = /^---\n---\n([\s\S]*)$/;

  const match = content.match(frontmatterRegex);
  let frontmatterYaml = "";
  let bodyContent = "";

  if (!match) {
    // Try the empty frontmatter case
    const emptyMatch = content.match(emptyFrontmatterRegex);
    if (emptyMatch?.[1]) {
      frontmatterYaml = "";
      bodyContent = emptyMatch[1];
    } else {
      return { frontmatter: {}, content };
    }
  } else {
    // TypeScript knows match is not null here
    frontmatterYaml = match[1] || "";
    bodyContent = match[2] || "";
  }

  // Simple YAML parser for basic key-value pairs
  const frontmatter: Record<string, unknown> = {};

  // Handle empty frontmatter case (just whitespace)
  if (!frontmatterYaml.trim()) {
    return { frontmatter, content: bodyContent };
  }

  const lines = frontmatterYaml.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    // Handle basic types
    if (value === "true") {
      frontmatter[key] = true;
    } else if (value === "false") {
      frontmatter[key] = false;
    } else if (/^\d+$/.test(value)) {
      frontmatter[key] = parseInt(value, 10);
    } else if (/^\d+\.\d+$/.test(value)) {
      frontmatter[key] = parseFloat(value);
    } else {
      // Remove quotes if present
      frontmatter[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }

  return { frontmatter, content: bodyContent };
}

export function stripFrontmatter(content: string): string {
  const { content: strippedContent } = parseFrontmatter(content);
  return strippedContent;
}

export function generateInstructions(config: AIConfig): string {
  let result = config.instructions;

  // Add rules content (without frontmatter)
  if (config.rules.length > 0) {
    result += "\n\n";
    for (const rule of config.rules) {
      result += `${rule.content}\n\n`;
    }
  }

  // Add commands list (just filenames without extension)
  if (config.commands.length > 0) {
    result += "\n## Available Commands\n\n";
    for (const command of config.commands) {
      result += `- ${command.filename.replace(".md", "")}\n`;
    }
  }

  return result.trim();
}

export async function ensureDirectoryExists(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function updateProviderSettings(
  filePath: string,
  mcpConfig: MCPConfig,
  updateKey: string,
): Promise<void> {
  let existingConfig: Record<string, unknown> = {};

  try {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      existingConfig = await file.json();
    }
  } catch {
    // File doesn't exist or invalid JSON, start fresh
    existingConfig = {};
  }

  // Update the specific key with MCP servers
  existingConfig[updateKey] = mcpConfig.mcpServers;

  await Bun.write(filePath, JSON.stringify(existingConfig, null, 2));
}

export async function generateFiles(config: AIConfig): Promise<GeneratedFiles> {
  const instructionsContent = generateInstructions(config);

  // Helper function to create file with frontmatter
  const createFileWithFrontmatter = (item: RuleFile): string => {
    const frontmatterString =
      Object.keys(item.frontmatter).length > 0
        ? "---\n" +
          Object.entries(item.frontmatter)
            .map(
              ([key, value]) =>
                `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
            )
            .join("\n") +
          "\n---\n"
        : "";
    return frontmatterString + item.content;
  };

  // Generate cursor rules with frontmatter preserved
  const cursorRules: Record<string, string> = {};
  for (const rule of config.rules) {
    cursorRules[rule.filename.replace(".md", ".mdc")] =
      createFileWithFrontmatter(rule);
  }

  // Generate Gemini settings
  const geminiSettings: GeminiSettings = {
    mcpServers: config.mcp.mcpServers,
  };

  // Generate OpenCode config - convert MCP servers to OpenCode format
  const openCodeMcpServers: Record<string, OpenCodeMCPServer> = {};

  for (const [serverName, serverConfig] of Object.entries(
    config.mcp.mcpServers,
  )) {
    openCodeMcpServers[serverName] = {
      type: "local",
      command: [serverConfig.command, ...(serverConfig.args || [])],
      ...(serverConfig.env &&
        Object.keys(serverConfig.env).length > 0 && {
          environment: serverConfig.env,
        }),
    };
  }

  const openCodeConfig: OpenCodeConfig = {
    mcp: openCodeMcpServers,
  };

  // Generate Copilot CLI agents from rules
  const copilotAgents: Record<string, string> = {};
  for (const rule of config.rules) {
    copilotAgents[rule.filename] = createFileWithFrontmatter(rule);
  }

  // Generate Kiro files
  const kiroSpecs: Record<string, string> = {};
  const kiroHooks: Record<string, string> = {};
  const kiroSteering: Record<string, string> = {};

  for (const rule of config.rules) {
    const type = rule.frontmatter.type as string | undefined;
    if (type === "spec") {
      kiroSpecs[rule.filename] = createFileWithFrontmatter(rule);
    } else {
      kiroSteering[rule.filename] = createFileWithFrontmatter(rule);
    }
  }

  for (const command of config.commands) {
    const type = command.frontmatter.type as string | undefined;
    if (type === "hook") {
      kiroHooks[command.filename] = createFileWithFrontmatter(command);
    }
  }

  // Generate VS Code Copilot files
  const vscodeCopilotPrompts: Record<string, string> = {};
  const vscodeCopilotAgents: Record<string, string> = {};

  for (const command of config.commands) {
    const type = command.frontmatter.type as string | undefined;
    if (type === "prompt") {
      vscodeCopilotPrompts[command.filename] =
        createFileWithFrontmatter(command);
    } else if (type === "agent") {
      vscodeCopilotAgents[command.filename] =
        createFileWithFrontmatter(command);
    }
  }

  // Generate Antigravity files
  const antigravityRules: Record<string, string> = {};
  const antigravityWorkflows: Record<string, string> = {};

  for (const rule of config.rules) {
    antigravityRules[rule.filename] = createFileWithFrontmatter(rule);
  }

  for (const command of config.commands) {
    const type = command.frontmatter.type as string | undefined;
    if (type === "workflow") {
      antigravityWorkflows[command.filename] =
        createFileWithFrontmatter(command);
    }
  }

  // Generate Dropstone workflows
  const dropstoneWorkflows: Record<string, string> = {};
  for (const command of config.commands) {
    const autonomous = command.frontmatter.autonomous;
    if (autonomous === true) {
      dropstoneWorkflows[command.filename] = createFileWithFrontmatter(command);
    }
  }

  return {
    "CLAUDE.md": instructionsContent,
    "GEMINI.md": instructionsContent,
    "AGENTS.md": instructionsContent,
    "WINDSURF.md": instructionsContent,
    "QODER.md": instructionsContent,
    "TRAE.md": instructionsContent,
    "JULES.md": instructionsContent,
    "QWEN.md": instructionsContent,
    ".mcp.json": JSON.stringify(config.mcp, null, 2),
    ".cursor/rules": cursorRules,
    ".gemini/settings.json": JSON.stringify(geminiSettings, null, 2),
    "opencode.json": JSON.stringify(openCodeConfig, null, 2),
    ".copilot/agents": copilotAgents,
    ".kiro/specs": kiroSpecs,
    ".kiro/hooks": kiroHooks,
    ".kiro/steering": kiroSteering,
    ".kiro/mcp.json": JSON.stringify(config.mcp, null, 2),
    ".github/copilot-instructions.md": instructionsContent,
    ".github/copilot-prompts": vscodeCopilotPrompts,
    ".github/agents": vscodeCopilotAgents,
    ".agent/rules": antigravityRules,
    ".agent/workflows": antigravityWorkflows,
    ".dropstone/workflows": dropstoneWorkflows,
  };
}

export async function writeGeneratedFiles(
  files: GeneratedFiles,
): Promise<void> {
  // Write CLAUDE.md, GEMINI.md, and AGENTS.md
  await Bun.write("CLAUDE.md", files["CLAUDE.md"]);
  await Bun.write("GEMINI.md", files["GEMINI.md"]);
  await Bun.write("AGENTS.md", files["AGENTS.md"]);

  // Write .mcp.json
  await Bun.write(".mcp.json", files[".mcp.json"]);

  // Write cursor rules
  await ensureDirectoryExists(".cursor/rules");
  for (const [filename, content] of Object.entries(files[".cursor/rules"])) {
    await Bun.write(`.cursor/rules/${filename}`, content);
  }

  // Write Gemini settings
  await ensureDirectoryExists(".gemini");
  await Bun.write(".gemini/settings.json", files[".gemini/settings.json"]);

  // Write OpenCode config
  await Bun.write("opencode.json", files["opencode.json"]);
}

export async function runGeneration() {
  console.log("🤖 dot-ai: Generating AI provider configurations...");

  // Check if .ai directory exists
  const aiDir = ".ai";
  const hasAiDir = await directoryExists(aiDir);
  if (!hasAiDir) {
    throw new Error(".ai directory not found in current directory");
  }

  // Read configuration from .ai directory
  const config = await readAIConfig(aiDir);

  // Generate all provider configuration files
  const files = await generateFiles(config);

  // Write generated files to disk
  await writeGeneratedFiles(files);

  console.log("✅ Successfully generated configuration files:");
  console.log("  - CLAUDE.md");
  console.log("  - GEMINI.md");
  console.log("  - AGENTS.md");
  console.log("  - .mcp.json");
  console.log("  - .cursor/rules/*.mdc");
  console.log("  - .gemini/settings.json");
  console.log("  - opencode.json");
}
