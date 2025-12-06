import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync } from "fs";
import {
  detectProviderFiles,
  extractAllMCPConfigs,
  runInit,
} from "./migrator.ts";

const TEST_DIR = "/tmp/dot-ai-migrator-test";

describe("Migrator Unit Tests", () => {
  beforeEach(async () => {
    // Clean up any existing test directory
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {}

    // Create test directory
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
  });

  afterEach(() => {
    // Clean up
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {}
  });

  describe("detectProviderFiles", () => {
    test("should find all available provider files", async () => {
      // Create test files
      await Bun.write("CLAUDE.md", "Claude instructions");
      await Bun.write("GEMINI.md", "Gemini instructions");
      await Bun.write("AGENTS.md", "Agents instructions");
      await Bun.write(".mcp.json", '{"mcpServers":{}}');

      mkdirSync(".cursor/rules", { recursive: true });
      await Bun.write(".cursor/rules/test.mdc", "Test rule");

      mkdirSync(".claude/commands", { recursive: true });
      await Bun.write(".claude/commands/deploy.md", "Deploy command");

      mkdirSync(".gemini", { recursive: true });
      await Bun.write(".gemini/settings.json", '{"mcpServers":{}}');

      await Bun.write("opencode.json", '{"mcp":{}}');

      const detected = await detectProviderFiles();

      expect(detected.claude).toBe("CLAUDE.md");
      expect(detected.gemini).toBe("GEMINI.md");
      expect(detected.agents).toBe("AGENTS.md");
      expect(detected.mcp).toBe(".mcp.json");
      expect(detected.geminiSettings).toBe(".gemini/settings.json");
      expect(detected.opencode).toBe("opencode.json");
      expect(detected.cursorRules).toEqual([".cursor/rules/test.mdc"]);
      expect(detected.claudeCommands).toEqual([".claude/commands/deploy.md"]);
    });

    test("should handle missing files gracefully", async () => {
      const detected = await detectProviderFiles();

      expect(detected.claude).toBeUndefined();
      expect(detected.gemini).toBeUndefined();
      expect(detected.agents).toBeUndefined();
      expect(detected.mcp).toBeUndefined();
      expect(detected.cursorRules).toEqual([]);
      expect(detected.claudeCommands).toEqual([]);
    });

    test("should find multiple cursor rules", async () => {
      mkdirSync(".cursor/rules", { recursive: true });
      await Bun.write(".cursor/rules/typescript.mdc", "TS rules");
      await Bun.write(".cursor/rules/forms.mdc", "Form rules");

      const detected = await detectProviderFiles();

      expect(detected.cursorRules).toHaveLength(2);
      expect(detected.cursorRules).toContain(".cursor/rules/typescript.mdc");
      expect(detected.cursorRules).toContain(".cursor/rules/forms.mdc");
    });

    test("should find multiple claude commands", async () => {
      mkdirSync(".claude/commands", { recursive: true });
      await Bun.write(".claude/commands/deploy.md", "Deploy cmd");
      await Bun.write(".claude/commands/test.md", "Test cmd");

      const detected = await detectProviderFiles();

      expect(detected.claudeCommands).toHaveLength(2);
      expect(detected.claudeCommands).toContain(".claude/commands/deploy.md");
      expect(detected.claudeCommands).toContain(".claude/commands/test.md");
    });

    test("should detect Windsurf files", async () => {
      await Bun.write("WINDSURF.md", "Windsurf instructions");
      mkdirSync(".windsurf/memories", { recursive: true });
      await Bun.write(".windsurf/memories/context.json", "{}");

      const detected = await detectProviderFiles();

      expect(detected.windsurf).toBe("WINDSURF.md");
      expect(detected.windsurfMemories).toContain(
        ".windsurf/memories/context.json",
      );
    });

    test("should detect Qoder files", async () => {
      await Bun.write("QODER.md", "Qoder instructions");

      const detected = await detectProviderFiles();

      expect(detected.qoder).toBe("QODER.md");
    });

    test("should detect TRAE files", async () => {
      await Bun.write("TRAE.md", "TRAE instructions");
      mkdirSync(".trae/agents", { recursive: true });
      await Bun.write(".trae/agents/coder.json", "{}");

      const detected = await detectProviderFiles();

      expect(detected.trae).toBe("TRAE.md");
      expect(detected.traeAgents).toContain(".trae/agents/coder.json");
    });

    test("should detect Jules AGENTS.md", async () => {
      await Bun.write("AGENTS.md", "Jules/AGENTS instructions");

      const detected = await detectProviderFiles();

      expect(detected.jules).toBe("AGENTS.md");
      // Should also be detected as agents
      expect(detected.agents).toBe("AGENTS.md");
    });

    test("should detect Qwen Code files", async () => {
      await Bun.write("QWEN.md", "Qwen instructions");
      mkdirSync(".qwen-code/commands", { recursive: true });
      await Bun.write(".qwen-code/commands/test.md", "Test command");

      const detected = await detectProviderFiles();

      expect(detected.qwen).toBe("QWEN.md");
      expect(detected.qwenCommands).toContain(".qwen-code/commands/test.md");
    });

    test("should detect Gemini CLI files", async () => {
      mkdirSync(".gemini", { recursive: true });
      await Bun.write(".gemini/commands/deploy.md", "Deploy");
      await Bun.write(".gemini/mcp-config.json", "{}");

      const detected = await detectProviderFiles();

      expect(detected.geminiCLICommands).toContain(
        ".gemini/commands/deploy.md",
      );
    });

    test("should detect GitHub Copilot CLI files", async () => {
      mkdirSync(".copilot/agents", { recursive: true });
      await Bun.write(".copilot/agents/planner.md", "Planner agent");
      await Bun.write(".copilot/mcp-config.json", "{}");

      mkdirSync(".github/agents", { recursive: true });
      await Bun.write(".github/agents/reviewer.md", "Reviewer agent");

      const detected = await detectProviderFiles();

      expect(detected.copilotAgents).toContain(".copilot/agents/planner.md");
      expect(detected.copilotRepoAgents).toContain(
        ".github/agents/reviewer.md",
      );
      expect(detected.copilotMCP).toBe(".copilot/mcp-config.json");
    });

    test("should detect Kiro files", async () => {
      mkdirSync(".kiro/specs", { recursive: true });
      await Bun.write(".kiro/specs/feature.md", "Feature spec");

      mkdirSync(".kiro/hooks", { recursive: true });
      await Bun.write(".kiro/hooks/pre-commit.md", "Pre-commit hook");

      mkdirSync(".kiro/steering", { recursive: true });
      await Bun.write(".kiro/steering/coding.md", "Coding rules");

      await Bun.write(".kiro/mcp.json", "{}");

      const detected = await detectProviderFiles();

      expect(detected.kiroSpecs).toContain(".kiro/specs/feature.md");
      expect(detected.kiroHooks).toContain(".kiro/hooks/pre-commit.md");
      expect(detected.kiroSteering).toContain(".kiro/steering/coding.md");
      expect(detected.kiroMCP).toBe(".kiro/mcp.json");
    });

    test("should detect VS Code Copilot files", async () => {
      mkdirSync(".github", { recursive: true });
      await Bun.write(
        ".github/copilot-instructions.md",
        "VS Code instructions",
      );

      mkdirSync(".github/copilot-prompts", { recursive: true });
      await Bun.write(".github/copilot-prompts/gen-tests.md", "Generate tests");

      mkdirSync(".github/agents", { recursive: true });
      await Bun.write(".github/agents/frontend.md", "Frontend agent");

      const detected = await detectProviderFiles();

      expect(detected.vscodeCopilotInstructions).toContain(
        ".github/copilot-instructions.md",
      );
      expect(detected.vscodeCopilotPrompts).toContain(
        ".github/copilot-prompts/gen-tests.md",
      );
      expect(detected.vscodeCopilotAgents).toContain(
        ".github/agents/frontend.md",
      );
    });

    test("should detect Antigravity files", async () => {
      // Global rules in home directory would normally be in ~/.gemini/GEMINI.md
      // For test, we'll just check workspace files

      mkdirSync(".agent/rules", { recursive: true });
      await Bun.write(".agent/rules/general.md", "General rules");

      mkdirSync(".agent/workflows", { recursive: true });
      await Bun.write(".agent/workflows/deploy.md", "Deploy workflow");

      const detected = await detectProviderFiles();

      expect(detected.antigravityRules).toContain(".agent/rules/general.md");
      expect(detected.antigravityWorkflows).toContain(
        ".agent/workflows/deploy.md",
      );
    });

    test("should detect Dropstone workflows", async () => {
      mkdirSync(".dropstone/workflows", { recursive: true });
      await Bun.write(".dropstone/workflows/auto-fix.md", "Auto-fix workflow");

      const detected = await detectProviderFiles();

      expect(detected.dropstoneWorkflows).toContain(
        ".dropstone/workflows/auto-fix.md",
      );
    });

    test("should detect multiple provider files simultaneously", async () => {
      // Create files from multiple providers
      await Bun.write("CLAUDE.md", "Claude");
      await Bun.write("WINDSURF.md", "Windsurf");
      await Bun.write("QODER.md", "Qoder");
      await Bun.write("AGENTS.md", "Jules/Agents");

      mkdirSync(".copilot/agents", { recursive: true });
      await Bun.write(".copilot/agents/test.md", "Test agent");

      mkdirSync(".kiro/specs", { recursive: true });
      await Bun.write(".kiro/specs/feature.md", "Feature");

      const detected = await detectProviderFiles();

      expect(detected.claude).toBe("CLAUDE.md");
      expect(detected.windsurf).toBe("WINDSURF.md");
      expect(detected.qoder).toBe("QODER.md");
      expect(detected.jules).toBe("AGENTS.md");
      expect(detected.copilotAgents).toHaveLength(1);
      expect(detected.kiroSpecs).toHaveLength(1);
    });
  });

  describe("extractAllMCPConfigs", () => {
    test("should merge MCP configs from all sources", async () => {
      // Create .mcp.json
      await Bun.write(
        ".mcp.json",
        JSON.stringify({
          mcpServers: {
            filesystem: { command: "npx", args: ["fs-server"] },
          },
        }),
      );

      // Create .gemini/settings.json
      mkdirSync(".gemini", { recursive: true });
      await Bun.write(
        ".gemini/settings.json",
        JSON.stringify({
          mcpServers: {
            git: { command: "npx", args: ["git-server"] },
          },
        }),
      );

      // Create opencode.json
      await Bun.write(
        "opencode.json",
        JSON.stringify({
          mcp: {
            postgres: {
              type: "local",
              command: ["bun", "postgres.ts"],
              environment: { DB_URL: "test" },
            },
          },
        }),
      );

      const { merged, duplicates } = await extractAllMCPConfigs();

      expect(Object.keys(merged.mcpServers)).toHaveLength(3);
      expect(merged.mcpServers.filesystem).toEqual({
        command: "npx",
        args: ["fs-server"],
      });
      expect(merged.mcpServers.git).toEqual({
        command: "npx",
        args: ["git-server"],
      });
      expect(merged.mcpServers.postgres).toEqual({
        type: "stdio",
        command: "bun",
        args: ["postgres.ts"],
        env: { DB_URL: "test" },
      });
      expect(duplicates).toEqual([]);
    });

    test("should detect duplicate server names", async () => {
      // Create .mcp.json
      await Bun.write(
        ".mcp.json",
        JSON.stringify({
          mcpServers: {
            filesystem: { command: "npx", args: ["fs-server"] },
          },
        }),
      );

      // Create .gemini/settings.json with duplicate
      mkdirSync(".gemini", { recursive: true });
      await Bun.write(
        ".gemini/settings.json",
        JSON.stringify({
          mcpServers: {
            filesystem: { command: "different", args: ["different-server"] },
          },
        }),
      );

      const { merged, duplicates } = await extractAllMCPConfigs();

      expect(duplicates).toContain("filesystem");
      // Last one wins
      expect(merged.mcpServers.filesystem).toEqual({
        command: "different",
        args: ["different-server"],
      });
    });

    test("should handle missing MCP files gracefully", async () => {
      const { merged, duplicates } = await extractAllMCPConfigs();

      expect(merged.mcpServers).toEqual({});
      expect(duplicates).toEqual([]);
    });

    test("should convert OpenCode format correctly", async () => {
      await Bun.write(
        "opencode.json",
        JSON.stringify({
          mcp: {
            test: {
              type: "local",
              command: ["bun", "--env-file", ".env", "server.ts"],
              environment: { PORT: "3000" },
            },
          },
        }),
      );

      const { merged } = await extractAllMCPConfigs();

      expect(merged.mcpServers.test).toEqual({
        type: "stdio",
        command: "bun",
        args: ["--env-file", ".env", "server.ts"],
        env: { PORT: "3000" },
      });
    });

    test("should handle malformed JSON files", async () => {
      await Bun.write(".mcp.json", "invalid json");

      const { merged, duplicates } = await extractAllMCPConfigs();

      expect(merged.mcpServers).toEqual({});
      expect(duplicates).toEqual([]);
    });

    test("should extract MCP config from Copilot CLI", async () => {
      mkdirSync(".copilot", { recursive: true });
      await Bun.write(
        ".copilot/mcp-config.json",
        JSON.stringify({
          mcpServers: {
            github: {
              type: "stdio",
              command: "npx",
              args: ["@modelcontextprotocol/server-github"],
              env: { GITHUB_TOKEN: "token" },
            },
          },
        }),
      );

      const { merged } = await extractAllMCPConfigs();

      expect(merged.mcpServers.github).toBeDefined();
      expect(merged.mcpServers.github?.command).toBe("npx");
      expect(merged.mcpServers.github?.env).toEqual({ GITHUB_TOKEN: "token" });
    });

    test("should extract MCP config from Kiro", async () => {
      mkdirSync(".kiro", { recursive: true });
      await Bun.write(
        ".kiro/mcp.json",
        JSON.stringify({
          mcpServers: {
            docker: {
              type: "stdio",
              command: "docker-mcp",
              args: ["--socket", "/var/run/docker.sock"],
            },
          },
        }),
      );

      const { merged } = await extractAllMCPConfigs();

      expect(merged.mcpServers.docker).toBeDefined();
      expect(merged.mcpServers.docker?.command).toBe("docker-mcp");
    });

    test("should merge MCP configs from all new provider sources", async () => {
      // Create MCP configs from multiple new providers
      mkdirSync(".copilot", { recursive: true });
      await Bun.write(
        ".copilot/mcp-config.json",
        JSON.stringify({
          mcpServers: {
            github: { command: "npx", args: ["github-server"] },
          },
        }),
      );

      mkdirSync(".kiro", { recursive: true });
      await Bun.write(
        ".kiro/mcp.json",
        JSON.stringify({
          mcpServers: {
            docker: { command: "docker-mcp" },
          },
        }),
      );

      // Also include existing providers
      await Bun.write(
        ".mcp.json",
        JSON.stringify({
          mcpServers: {
            filesystem: { command: "npx", args: ["fs-server"] },
          },
        }),
      );

      const { merged, duplicates } = await extractAllMCPConfigs();

      expect(Object.keys(merged.mcpServers)).toHaveLength(3);
      expect(merged.mcpServers.github).toBeDefined();
      expect(merged.mcpServers.docker).toBeDefined();
      expect(merged.mcpServers.filesystem).toBeDefined();
      expect(duplicates).toEqual([]);
    });

    test("should detect duplicates across all MCP sources", async () => {
      // Same server name in different sources
      await Bun.write(
        ".mcp.json",
        JSON.stringify({
          mcpServers: {
            shared: { command: "mcp-v1" },
          },
        }),
      );

      mkdirSync(".copilot", { recursive: true });
      await Bun.write(
        ".copilot/mcp-config.json",
        JSON.stringify({
          mcpServers: {
            shared: { command: "mcp-v2" },
          },
        }),
      );

      mkdirSync(".kiro", { recursive: true });
      await Bun.write(
        ".kiro/mcp.json",
        JSON.stringify({
          mcpServers: {
            shared: { command: "mcp-v3" },
          },
        }),
      );

      const { merged, duplicates } = await extractAllMCPConfigs();

      expect(duplicates).toContain("shared");
      // Duplicates array is deduplicated, so "shared" appears once
      expect(duplicates.length).toBe(1);
      // Last one wins
      expect(merged.mcpServers.shared?.command).toBe("mcp-v3");
    });
  });
});

describe("Migration Integration Tests", () => {
  beforeEach(async () => {
    // Clean up any existing test directory
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {}

    // Create test directory
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
  });

  afterEach(() => {
    // Clean up
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {}
  });

  test("should migrate complete provider setup to .ai folder", async () => {
    // Create complete provider setup
    await Bun.write(
      "CLAUDE.md",
      "# Claude Instructions\\n\\nMain instructions for Claude.",
    );
    await Bun.write(
      "GEMINI.md",
      "# Gemini Instructions\\n\\nSpecific instructions for Gemini.",
    );
    await Bun.write(
      "AGENTS.md",
      "# Agents Instructions\\n\\nSpecific instructions for Agents.",
    );

    mkdirSync(".cursor/rules", { recursive: true });
    await Bun.write(
      ".cursor/rules/typescript.mdc",
      `---
title: TypeScript Rules
enabled: true
---

# TypeScript Rules

Use strict types.`,
    );

    mkdirSync(".claude/commands", { recursive: true });
    await Bun.write(
      ".claude/commands/deploy.md",
      "# Deploy Command\n\nDeploy the application.",
    );

    await Bun.write(
      ".mcp.json",
      JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: ["fs-server"] },
        },
      }),
    );

    // Run migration
    await runInit();

    // Verify .ai structure was created
    expect(await Bun.file(".ai/instructions.md").exists()).toBe(true);
    expect(await Bun.file(".ai/rules/typescript.md").exists()).toBe(true);
    expect(await Bun.file(".ai/commands/deploy.md").exists()).toBe(true);
    expect(await Bun.file(".ai/mcp.json").exists()).toBe(true);

    // Verify content
    const instructions = await Bun.file(".ai/instructions.md").text();
    expect(instructions).toContain("Claude Instructions");
    expect(instructions).toContain("---");
    expect(instructions).toContain("Gemini Instructions");
    expect(instructions).toContain("Agents Instructions");

    const rule = await Bun.file(".ai/rules/typescript.md").text();
    expect(rule).toContain("title: TypeScript Rules");
    expect(rule).toContain("Use strict types.");

    const command = await Bun.file(".ai/commands/deploy.md").text();
    expect(command).toContain("Deploy Command");

    const mcp = await Bun.file(".ai/mcp.json").json();
    expect(mcp.mcpServers.filesystem).toBeDefined();
  });

  test("should fail if .ai folder already exists", async () => {
    // Create .ai folder
    mkdirSync(".ai", { recursive: true });

    // Create some provider files
    await Bun.write("CLAUDE.md", "Instructions");

    // Should not throw error - runInit handles existing .ai folder
    await runInit();
    expect(await Bun.file(".ai/instructions.md").exists()).toBe(false); // Should not create anything
  });

  test("should handle partial provider configs", async () => {
    // Only create some files
    await Bun.write("CLAUDE.md", "Only Claude instructions");

    mkdirSync(".cursor/rules", { recursive: true });
    await Bun.write(".cursor/rules/test.mdc", "Test rule");

    await runInit();

    // Should create what it can
    expect(await Bun.file(".ai/instructions.md").exists()).toBe(true);
    expect(await Bun.file(".ai/rules/test.md").exists()).toBe(true);
    expect(await Bun.file(".ai/mcp.json").exists()).toBe(true); // runInit always creates empty mcp.json

    const instructions = await Bun.file(".ai/instructions.md").text();
    expect(instructions).toBe("Only Claude instructions");
  });

  test("should create initial structure when no provider files found", async () => {
    // runInit creates initial structure when no provider files found
    await runInit();
    expect(await Bun.file(".ai/instructions.md").exists()).toBe(true);
  });

  test("should handle MCP duplicate detection", async () => {
    // Create files with duplicate MCP servers
    await Bun.write("CLAUDE.md", "Instructions");

    await Bun.write(
      ".mcp.json",
      JSON.stringify({
        mcpServers: { test: { command: "original" } },
      }),
    );

    mkdirSync(".gemini", { recursive: true });
    await Bun.write(
      ".gemini/settings.json",
      JSON.stringify({
        mcpServers: { test: { command: "duplicate" } },
      }),
    );

    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => logs.push(args.join(" "));

    try {
      await runInit();

      // Should mention duplicates
      const output = logs.join("\n");
      expect(output).toContain("Duplicate MCP servers found: test");
    } finally {
      console.log = originalLog;
    }
  });

  test("should create valid .ai structure that can regenerate", async () => {
    // Create provider files
    await Bun.write("CLAUDE.md", "Test instructions");

    mkdirSync(".cursor/rules", { recursive: true });
    await Bun.write(
      ".cursor/rules/test.mdc",
      `---
enabled: true
---

Test rule content`,
    );

    await Bun.write(
      ".mcp.json",
      JSON.stringify({
        mcpServers: { test: { command: "test-cmd" } },
      }),
    );

    // Run migration
    await runInit();

    // Import generation functions to test
    const { readAIConfig, generateFiles } = await import("./generator.ts");

    // Should be able to read the migrated config
    const config = await readAIConfig(".ai");
    expect(config.instructions).toContain("Test instructions");
    expect(config.rules).toHaveLength(1);
    expect(config.rules[0]?.content).toContain("Test rule content");
    expect(config.mcp.mcpServers.test).toBeDefined();

    // Should be able to generate files from migrated config
    const files = await generateFiles(config);
    expect(files["CLAUDE.md"]).toContain("Test instructions");
    expect(files["CLAUDE.md"]).toContain("Test rule content");
  });

  test("should migrate Windsurf configuration to .ai folder", async () => {
    await Bun.write(
      "WINDSURF.md",
      "# Windsurf Instructions\n\nUse Cascade mode.",
    );

    mkdirSync(".windsurf/memories", { recursive: true });
    await Bun.write(
      ".windsurf/memories/project.json",
      JSON.stringify({
        context: "Frontend React project",
      }),
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    expect(config.instructions).toContain("Windsurf Instructions");
    expect(config.instructions).toContain("Cascade mode");
    // Memories are optional - just verify migration worked
    expect(await Bun.file(".ai/instructions.md").exists()).toBe(true);
  });

  test("should migrate Qoder configuration to .ai folder", async () => {
    await Bun.write(
      "QODER.md",
      "# Qoder Instructions\n\nFocus on code quality.",
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    expect(config.instructions).toContain("Qoder Instructions");
    expect(config.instructions).toContain("code quality");
  });

  test("should migrate TRAE configuration to .ai folder", async () => {
    await Bun.write(
      "TRAE.md",
      "# TRAE Instructions\n\nUse autonomous workflows.",
    );

    mkdirSync(".trae/agents", { recursive: true });
    await Bun.write(
      ".trae/agents/coder.json",
      JSON.stringify({
        name: "coder",
        role: "coding assistant",
      }),
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    expect(config.instructions).toContain("TRAE Instructions");
    expect(config.instructions).toContain("autonomous workflows");
  });

  test("should migrate Qwen Code configuration to .ai folder", async () => {
    await Bun.write("QWEN.md", "# Qwen Instructions\n\nOptimize for speed.");

    mkdirSync(".qwen-code/commands", { recursive: true });
    await Bun.write(
      ".qwen-code/commands/optimize.md",
      "Run performance optimization",
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    expect(config.instructions).toContain("Qwen Instructions");
    expect(config.instructions).toContain("Optimize for speed");

    // Verify command was migrated
    expect(config.commands.length).toBeGreaterThan(0);
    const optimizeCmd = config.commands.find(
      (c) => c.filename === "optimize.md",
    );
    expect(optimizeCmd).toBeDefined();
  });

  test("should migrate GitHub Copilot CLI agents to .ai folder", async () => {
    mkdirSync(".copilot/agents", { recursive: true });
    await Bun.write(
      ".copilot/agents/reviewer.md",
      `---
name: Code Reviewer
description: Reviews pull requests
---

Review code for best practices.`,
    );

    mkdirSync(".copilot", { recursive: true });
    await Bun.write(
      ".copilot/mcp-config.json",
      JSON.stringify({
        mcpServers: {
          github: {
            command: "npx",
            args: ["@modelcontextprotocol/server-github"],
          },
        },
      }),
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    // Commands should include the agent
    const reviewerAgent = config.commands.find(
      (c) => c.filename === "reviewer.md",
    );
    expect(reviewerAgent).toBeDefined();
    expect(reviewerAgent?.frontmatter.name).toBe("Code Reviewer");

    // MCP should be merged
    expect(config.mcp.mcpServers.github).toBeDefined();
  });

  test("should migrate Kiro configuration to .ai folder", async () => {
    mkdirSync(".kiro/specs", { recursive: true });
    await Bun.write(
      ".kiro/specs/feature.md",
      "## Feature Spec\n\nImplement new dashboard",
    );

    mkdirSync(".kiro/hooks", { recursive: true });
    await Bun.write(
      ".kiro/hooks/pre-commit.md",
      `---
type: hook
trigger: pre-commit
---

Run linting before commit`,
    );

    mkdirSync(".kiro/steering", { recursive: true });
    await Bun.write(
      ".kiro/steering/code-style.md",
      "# Code Style\n\nUse TypeScript strict mode",
    );

    await Bun.write(
      ".kiro/mcp.json",
      JSON.stringify({
        mcpServers: {
          docker: { command: "docker-mcp" },
        },
      }),
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    // Specs, hooks, and steering should be in commands/rules
    expect(config.commands.length + config.rules.length).toBeGreaterThan(0);

    // MCP should be merged
    expect(config.mcp.mcpServers.docker).toBeDefined();
  });

  test("should migrate VS Code Copilot configuration to .ai folder", async () => {
    mkdirSync(".github", { recursive: true });
    await Bun.write(".github/copilot-instructions.md", "Use concise responses");

    mkdirSync(".github/copilot-prompts", { recursive: true });
    await Bun.write(
      ".github/copilot-prompts/generate-tests.md",
      "Generate comprehensive test cases",
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    // Instructions should be included
    expect(config.instructions).toContain("concise responses");

    // Prompts should be in commands
    const testPrompt = config.commands.find(
      (c) => c.filename === "generate-tests.md",
    );
    expect(testPrompt).toBeDefined();
  });

  test("should migrate Antigravity configuration to .ai folder", async () => {
    mkdirSync(".agent/rules", { recursive: true });
    await Bun.write(
      ".agent/rules/general.md",
      `---
priority: high
---

Follow clean code principles`,
    );

    mkdirSync(".agent/workflows", { recursive: true });
    await Bun.write(
      ".agent/workflows/deploy.md",
      `---
type: workflow
---

Deploy to production`,
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    // Rules and workflows should be migrated
    const generalRule = config.rules.find((r) => r.filename === "general.md");
    expect(generalRule).toBeDefined();
    expect(generalRule?.frontmatter.priority).toBe("high");

    const deployWorkflow = config.commands.find(
      (c) => c.filename === "deploy.md",
    );
    expect(deployWorkflow).toBeDefined();
    expect(deployWorkflow?.frontmatter.type).toBe("workflow");
  });

  test("should migrate Dropstone workflows to .ai folder", async () => {
    mkdirSync(".dropstone/workflows", { recursive: true });
    await Bun.write(
      ".dropstone/workflows/auto-fix.md",
      `---
autonomous: true
---

Automatically fix linting errors`,
    );

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    // Workflow should be in commands
    const autoFixWorkflow = config.commands.find(
      (c) => c.filename === "auto-fix.md",
    );
    expect(autoFixWorkflow).toBeDefined();
    expect(autoFixWorkflow?.frontmatter.autonomous).toBe(true);
  });

  test("should migrate multiple new providers simultaneously", async () => {
    // Create configs from multiple new providers
    await Bun.write("WINDSURF.md", "Windsurf config");
    await Bun.write("QODER.md", "Qoder config");
    await Bun.write("TRAE.md", "TRAE config");

    mkdirSync(".copilot/agents", { recursive: true });
    await Bun.write(".copilot/agents/test.md", "Test agent");

    mkdirSync(".kiro/specs", { recursive: true });
    await Bun.write(".kiro/specs/feature.md", "Feature spec");

    mkdirSync(".agent/rules", { recursive: true });
    await Bun.write(".agent/rules/style.md", "Style rules");

    mkdirSync(".dropstone/workflows", { recursive: true });
    await Bun.write(".dropstone/workflows/auto.md", "Auto workflow");

    await runInit();

    const { readAIConfig } = await import("./generator.ts");
    const config = await readAIConfig(".ai");

    // All instructions should be merged
    expect(config.instructions).toContain("Windsurf config");
    expect(config.instructions).toContain("Qoder config");
    expect(config.instructions).toContain("TRAE config");

    // All commands/rules should be migrated
    expect(config.commands.length + config.rules.length).toBeGreaterThan(3);
  });
});
