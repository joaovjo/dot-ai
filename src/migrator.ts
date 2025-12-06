import path from "path";
import { directoryExists, ensureDirectoryExists } from "./generator.ts";
import type {
  DetectedFiles,
  GeminiSettings,
  MCPConfig,
  MCPServer,
  OpenCodeConfig,
} from "./types.ts";

export async function detectProviderFiles(): Promise<DetectedFiles> {
  const detected: DetectedFiles = {
    cursorRules: [],
    claudeCommands: [],
    windsurfMemories: [],
    traeAgents: [],
    qwenCommands: [],
    geminiCLICommands: [],
    copilotAgents: [],
    copilotRepoAgents: [],
    kiroSpecs: [],
    kiroHooks: [],
    kiroSteering: [],
    vscodeCopilotInstructions: [],
    vscodeCopilotPrompts: [],
    vscodeCopilotAgents: [],
    antigravityRules: [],
    antigravityWorkflows: [],
    dropstoneWorkflows: [],
  };

  // Check for instruction files (existing providers)
  if (await Bun.file("CLAUDE.md").exists()) {
    detected.claude = "CLAUDE.md";
  }
  if (await Bun.file("GEMINI.md").exists()) {
    detected.gemini = "GEMINI.md";
  }
  if (await Bun.file("AGENTS.md").exists()) {
    detected.agents = "AGENTS.md";
    detected.jules = "AGENTS.md"; // Jules also uses AGENTS.md
  }

  // Check for new provider instruction files
  if (await Bun.file("WINDSURF.md").exists()) {
    detected.windsurf = "WINDSURF.md";
  }
  if (await Bun.file("QODER.md").exists()) {
    detected.qoder = "QODER.md";
  }
  if (await Bun.file("TRAE.md").exists()) {
    detected.trae = "TRAE.md";
  }
  if (await Bun.file("QWEN.md").exists()) {
    detected.qwen = "QWEN.md";
  }

  // Check for MCP files (existing)
  if (await Bun.file(".mcp.json").exists()) {
    detected.mcp = ".mcp.json";
  }
  if (await Bun.file(".gemini/settings.json").exists()) {
    detected.geminiSettings = ".gemini/settings.json";
  }
  if (await Bun.file("opencode.json").exists()) {
    detected.opencode = "opencode.json";
  }

  // Check for new provider MCP files
  if (await Bun.file(".copilot/mcp-config.json").exists()) {
    detected.copilotMCP = ".copilot/mcp-config.json";
  }
  if (await Bun.file(".kiro/mcp.json").exists()) {
    detected.kiroMCP = ".kiro/mcp.json";
  }

  // Check for .cursor/rules/ (existing)
  if (await directoryExists(".cursor/rules")) {
    const glob = new Bun.Glob("*.mdc");
    for await (const file of glob.scan({ cwd: ".cursor/rules" })) {
      detected.cursorRules.push(`.cursor/rules/${file}`);
    }
  }

  // Check for .claude/commands/ (existing)
  if (await directoryExists(".claude/commands")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".claude/commands" })) {
      detected.claudeCommands.push(`.claude/commands/${file}`);
    }
  }

  // Check for Windsurf memories
  if (await directoryExists(".windsurf/memories")) {
    const glob = new Bun.Glob("*.json");
    for await (const file of glob.scan({ cwd: ".windsurf/memories" })) {
      detected.windsurfMemories.push(`.windsurf/memories/${file}`);
    }
  }

  // Check for TRAE agents
  if (await directoryExists(".trae/agents")) {
    const glob = new Bun.Glob("*.json");
    for await (const file of glob.scan({ cwd: ".trae/agents" })) {
      detected.traeAgents.push(`.trae/agents/${file}`);
    }
  }

  // Check for Qwen Code commands
  if (await directoryExists(".qwen-code/commands")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".qwen-code/commands" })) {
      detected.qwenCommands.push(`.qwen-code/commands/${file}`);
    }
  }

  // Check for Gemini CLI commands
  if (await directoryExists(".gemini/commands")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".gemini/commands" })) {
      detected.geminiCLICommands.push(`.gemini/commands/${file}`);
    }
  }

  // Check for GitHub Copilot CLI agents (workspace and repo)
  if (await directoryExists(".copilot/agents")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".copilot/agents" })) {
      detected.copilotAgents.push(`.copilot/agents/${file}`);
    }
  }
  if (await directoryExists(".github/agents")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".github/agents" })) {
      detected.copilotRepoAgents.push(`.github/agents/${file}`);
    }
  }

  // Check for Kiro files
  if (await directoryExists(".kiro/specs")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".kiro/specs" })) {
      detected.kiroSpecs.push(`.kiro/specs/${file}`);
    }
  }
  if (await directoryExists(".kiro/hooks")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".kiro/hooks" })) {
      detected.kiroHooks.push(`.kiro/hooks/${file}`);
    }
  }
  if (await directoryExists(".kiro/steering")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".kiro/steering" })) {
      detected.kiroSteering.push(`.kiro/steering/${file}`);
    }
  }

  // Check for VS Code Copilot files
  if (await Bun.file(".github/copilot-instructions.md").exists()) {
    detected.vscodeCopilotInstructions.push(".github/copilot-instructions.md");
  }
  if (await directoryExists(".github/copilot-prompts")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".github/copilot-prompts" })) {
      detected.vscodeCopilotPrompts.push(`.github/copilot-prompts/${file}`);
    }
  }
  if (await directoryExists(".github/agents")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".github/agents" })) {
      detected.vscodeCopilotAgents.push(`.github/agents/${file}`);
    }
  }

  // Check for Antigravity files
  if (await directoryExists(".agent/rules")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".agent/rules" })) {
      detected.antigravityRules.push(`.agent/rules/${file}`);
    }
  }
  if (await directoryExists(".agent/workflows")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".agent/workflows" })) {
      detected.antigravityWorkflows.push(`.agent/workflows/${file}`);
    }
  }

  // Check for Dropstone workflows
  if (await directoryExists(".dropstone/workflows")) {
    const glob = new Bun.Glob("*.md");
    for await (const file of glob.scan({ cwd: ".dropstone/workflows" })) {
      detected.dropstoneWorkflows.push(`.dropstone/workflows/${file}`);
    }
  }

  return detected;
}

export async function extractAllMCPConfigs(): Promise<{
  merged: MCPConfig;
  duplicates: string[];
}> {
  const allServers: Record<string, MCPServer> = {};
  const duplicates: string[] = [];

  // 1. Load from .mcp.json
  try {
    if (await Bun.file(".mcp.json").exists()) {
      const mcpConfig = (await Bun.file(".mcp.json").json()) as MCPConfig;
      if (mcpConfig.mcpServers) {
        Object.assign(allServers, mcpConfig.mcpServers);
      }
    }
  } catch (error) {
    console.warn("Could not read .mcp.json:", error);
  }

  // 2. Load from .gemini/settings.json
  try {
    if (await Bun.file(".gemini/settings.json").exists()) {
      const geminiSettings = (await Bun.file(
        ".gemini/settings.json",
      ).json()) as GeminiSettings;
      if (geminiSettings.mcpServers) {
        for (const [name, server] of Object.entries(
          geminiSettings.mcpServers,
        )) {
          if (allServers[name]) {
            duplicates.push(name);
          }
          allServers[name] = server;
        }
      }
    }
  } catch (error) {
    console.warn("Could not read .gemini/settings.json:", error);
  }

  // 3. Load from opencode.json (convert format)
  try {
    if (await Bun.file("opencode.json").exists()) {
      const openCodeConfig = (await Bun.file(
        "opencode.json",
      ).json()) as OpenCodeConfig;
      if (openCodeConfig.mcp) {
        for (const [name, openCodeServer] of Object.entries(
          openCodeConfig.mcp,
        )) {
          if (allServers[name]) {
            duplicates.push(name);
          }
          // Convert OpenCode format back to standard format
          allServers[name] = {
            type: "stdio", // OpenCode uses "local" but standard uses "stdio"
            command: openCodeServer.command?.[0] || "",
            args: openCodeServer.command?.slice(1) || [],
            env: openCodeServer.environment || {},
          };
        }
      }
    }
  } catch (error) {
    console.warn("Could not read opencode.json:", error);
  }

  // 4. Load from .copilot/mcp-config.json
  try {
    if (await Bun.file(".copilot/mcp-config.json").exists()) {
      const copilotMCP = (await Bun.file(
        ".copilot/mcp-config.json",
      ).json()) as MCPConfig;
      if (copilotMCP.mcpServers) {
        for (const [name, server] of Object.entries(copilotMCP.mcpServers)) {
          if (allServers[name]) {
            duplicates.push(name);
          }
          allServers[name] = server;
        }
      }
    }
  } catch (error) {
    console.warn("Could not read .copilot/mcp-config.json:", error);
  }

  // 5. Load from .kiro/mcp.json
  try {
    if (await Bun.file(".kiro/mcp.json").exists()) {
      const kiroMCP = (await Bun.file(".kiro/mcp.json").json()) as MCPConfig;
      if (kiroMCP.mcpServers) {
        for (const [name, server] of Object.entries(kiroMCP.mcpServers)) {
          if (allServers[name]) {
            duplicates.push(name);
          }
          allServers[name] = server;
        }
      }
    }
  } catch (error) {
    console.warn("Could not read .kiro/mcp.json:", error);
  }

  return {
    merged: { mcpServers: allServers },
    duplicates: [...new Set(duplicates)], // Remove duplicate names
  };
}

async function createInitialAIStructure(): Promise<void> {
  // Create .ai structure
  await ensureDirectoryExists(".ai/rules");
  await ensureDirectoryExists(".ai/commands");

  // Create dummy instructions.md
  const dummyInstructions = `# AI Instructions

This is your AI assistant configuration file. You can:

- Add project-specific instructions here
- Include coding conventions and preferences  
- Define your preferred communication style
- Add any context that helps the AI understand your project

## Project Context

Add information about your project here.

## Coding Style

Add your preferred coding patterns and conventions here.
`;

  await Bun.write(".ai/instructions.md", dummyInstructions);

  // Create dummy rule file
  const dummyRule = `---
name: example-rule
description: An example rule showing the format
---

# Example Rule

This is an example rule file. You can create multiple rule files in the rules/ directory.

Each rule can have:
- Frontmatter with metadata (name, description, etc.)
- Markdown content with specific instructions or patterns

Delete this file and add your own rules as needed.
`;

  await Bun.write(".ai/rules/example.md", dummyRule);

  // Create dummy command file
  const dummyCommand = `# example-command

This is an example command file. You can create multiple command files in the commands/ directory.

Commands can contain:
- Specific instructions for tasks
- Code templates
- Workflow descriptions

Delete this file and add your own commands as needed.
`;

  await Bun.write(".ai/commands/example.md", dummyCommand);

  // Create empty MCP config
  const emptyMCP = {
    mcpServers: {},
  };

  await Bun.write(".ai/mcp.json", JSON.stringify(emptyMCP, null, 2));
}

export async function runInit(): Promise<void> {
  // Check if .ai already exists
  if (await directoryExists(".ai")) {
    console.log("✅ .ai folder already exists - nothing to do!");
    return;
  }

  // Check for existing provider files
  const detected = await detectProviderFiles();

  // Check if we found any provider files
  const hasAnyFiles =
    detected.claude ||
    detected.gemini ||
    detected.agents ||
    detected.cursorRules.length > 0 ||
    detected.claudeCommands.length > 0 ||
    detected.mcp ||
    detected.geminiSettings ||
    detected.opencode;

  if (hasAnyFiles) {
    // Run migration logic
    console.log(
      "🔄 Found existing AI provider files, migrating to .ai/ folder...",
    );

    // Create .ai structure
    await ensureDirectoryExists(".ai/rules");
    await ensureDirectoryExists(".ai/commands");

    const createdFiles: string[] = [];

    // Migrate instructions - concatenate CLAUDE.md + GEMINI.md + AGENTS.md
    let instructions = "";
    if (detected.claude) {
      instructions += await Bun.file(detected.claude).text();
    }
    if (detected.gemini) {
      if (instructions) instructions += "\n\n---\n\n";
      instructions += await Bun.file(detected.gemini).text();
    }
    if (detected.agents) {
      if (instructions) instructions += "\n\n---\n\n";
      instructions += await Bun.file(detected.agents).text();
    }
    if (instructions) {
      await Bun.write(".ai/instructions.md", instructions);
      createdFiles.push(".ai/instructions.md");
    }

    // Migrate rules (.mdc → .md)
    for (const ruleFile of detected.cursorRules) {
      const content = await Bun.file(ruleFile).text();
      const filename = path.basename(ruleFile).replace(".mdc", ".md");
      await Bun.write(`.ai/rules/${filename}`, content);
    }
    if (detected.cursorRules.length > 0) {
      createdFiles.push(`.ai/rules/ (${detected.cursorRules.length} files)`);
    }

    // Migrate commands
    for (const commandFile of detected.claudeCommands) {
      const content = await Bun.file(commandFile).text();
      const filename = path.basename(commandFile);
      await Bun.write(`.ai/commands/${filename}`, content);
    }
    if (detected.claudeCommands.length > 0) {
      createdFiles.push(
        `.ai/commands/ (${detected.claudeCommands.length} files)`,
      );
    }

    // Merge MCP configs
    const { merged, duplicates } = await extractAllMCPConfigs();
    const serverCount = Object.keys(merged.mcpServers).length;

    if (serverCount > 0) {
      await Bun.write(".ai/mcp.json", JSON.stringify(merged, null, 2));
      createdFiles.push(`.ai/mcp.json (${serverCount} servers)`);
    } else {
      // Create empty MCP config if no servers found
      await Bun.write(
        ".ai/mcp.json",
        JSON.stringify({ mcpServers: {} }, null, 2),
      );
      createdFiles.push(".ai/mcp.json");
    }

    // Report results
    console.log("✅ Migration completed!");
    console.log("");
    console.log("Created:");
    for (const file of createdFiles) {
      console.log(`  ${file}`);
    }

    if (duplicates.length > 0) {
      console.log("");
      console.log(`⚠️  Duplicate MCP servers found: ${duplicates.join(", ")}`);
      console.log(
        "   Please review .ai/mcp.json and resolve conflicts manually",
      );
    }
  } else {
    // No provider files found, create initial structure with dummy content
    console.log("🚀 Initializing new .ai/ folder with example content...");

    await createInitialAIStructure();

    console.log("✅ Initialization completed!");
    console.log("");
    console.log("Created:");
    console.log("  .ai/instructions.md");
    console.log("  .ai/rules/example.md");
    console.log("  .ai/commands/example.md");
    console.log("  .ai/mcp.json");
    console.log("");
    console.log(
      "💡 Edit the files in .ai/ to customize your AI assistant configuration.",
    );
  }
}
