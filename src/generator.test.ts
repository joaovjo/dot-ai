import { describe, expect, test } from "bun:test";
import {
  generateFiles,
  generateInstructions,
  parseFrontmatter,
  stripFrontmatter,
} from "./generator.ts";
import type { AIConfig } from "./types.ts";

describe("parseFrontmatter", () => {
  test("should parse YAML frontmatter correctly", () => {
    const content = `---
title: Test Rule
enabled: true
priority: 1
description: A test rule
---

This is the content of the rule`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      title: "Test Rule",
      enabled: true,
      priority: 1,
      description: "A test rule",
    });
    expect(result.content).toBe("\nThis is the content of the rule");
  });

  test("should handle content without frontmatter", () => {
    const content = "This is just regular content";
    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe("This is just regular content");
  });

  test("should handle empty frontmatter", () => {
    const content = `---
---

Content here`;

    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe("\nContent here");
  });

  test("should handle different value types", () => {
    const content = `---
string_value: hello world
quoted_string: "hello world"
single_quoted: 'hello world'
boolean_true: true
boolean_false: false
integer: 42
float: 3.14
---

Content`;

    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({
      string_value: "hello world",
      quoted_string: "hello world",
      single_quoted: "hello world",
      boolean_true: true,
      boolean_false: false,
      integer: 42,
      float: 3.14,
    });
  });
});

describe("stripFrontmatter", () => {
  test("should remove frontmatter and return content only", () => {
    const content = `---
title: Test
---

This is the content`;

    const result = stripFrontmatter(content);
    expect(result).toBe("\nThis is the content");
  });

  test("should return original content if no frontmatter", () => {
    const content = "This is just content";
    const result = stripFrontmatter(content);
    expect(result).toBe("This is just content");
  });
});

describe("generateInstructions", () => {
  test("should combine instructions, rules, and commands", () => {
    const config: AIConfig = {
      instructions: "Main instructions here",
      rules: [
        {
          frontmatter: { title: "Rule 1" },
          content: "Rule 1 content",
          filename: "rule1.md",
        },
        {
          frontmatter: {},
          content: "Rule 2 content",
          filename: "rule2.md",
        },
      ],
      commands: [
        {
          frontmatter: {},
          content: "Command 1 content",
          filename: "command1.md",
        },
        {
          frontmatter: {},
          content: "Command 2 content",
          filename: "command2.md",
        },
      ],
      mcp: { mcpServers: {} },
    };

    const result = generateInstructions(config);

    expect(result).toContain("Main instructions here");
    expect(result).toContain("Rule 1 content");
    expect(result).toContain("Rule 2 content");
    expect(result).toContain("## Available Commands");
    expect(result).toContain("- command1");
    expect(result).toContain("- command2");
  });

  test("should handle empty rules and commands", () => {
    const config: AIConfig = {
      instructions: "Just instructions",
      rules: [],
      commands: [],
      mcp: { mcpServers: {} },
    };

    const result = generateInstructions(config);
    expect(result).toBe("Just instructions");
  });

  test("should handle only rules without commands", () => {
    const config: AIConfig = {
      instructions: "Instructions",
      rules: [
        {
          frontmatter: {},
          content: "Rule content",
          filename: "rule.md",
        },
      ],
      commands: [],
      mcp: { mcpServers: {} },
    };

    const result = generateInstructions(config);
    expect(result).toContain("Instructions");
    expect(result).toContain("Rule content");
    expect(result).not.toContain("Available Commands");
  });
});

describe("generateFiles", () => {
  test("should generate all required files", async () => {
    const config: AIConfig = {
      instructions: "Test instructions",
      rules: [
        {
          frontmatter: { enabled: true },
          content: "Test rule",
          filename: "test.md",
        },
      ],
      commands: [
        {
          frontmatter: {},
          content: "Test command content",
          filename: "test-command.md",
        },
      ],
      mcp: {
        mcpServers: {
          test: {
            command: "test-cmd",
            args: ["--test"],
          },
        },
      },
    };

    const files = await generateFiles(config);

    // Check that all expected files are generated
    expect(files["CLAUDE.md"]).toBeDefined();
    expect(files["GEMINI.md"]).toBeDefined();
    expect(files["AGENTS.md"]).toBeDefined();
    expect(files[".mcp.json"]).toBeDefined();
    expect(files[".cursor/rules"]).toBeDefined();
    expect(files[".gemini/settings.json"]).toBeDefined();
    expect(files["opencode.json"]).toBeDefined();

    // Check CLAUDE.md, GEMINI.md, and AGENTS.md are identical
    expect(files["CLAUDE.md"]).toBe(files["GEMINI.md"]);
    expect(files["CLAUDE.md"]).toBe(files["AGENTS.md"]);

    // Check content includes everything
    expect(files["CLAUDE.md"]).toContain("Test instructions");
    expect(files["CLAUDE.md"]).toContain("Test rule");
    expect(files["CLAUDE.md"]).toContain("test-command");

    // Check MCP config is properly formatted
    const mcpConfig = JSON.parse(files[".mcp.json"]);
    expect(mcpConfig.mcpServers.test).toEqual({
      command: "test-cmd",
      args: ["--test"],
    });

    // Check cursor rules preserve frontmatter
    expect(files[".cursor/rules"]["test.mdc"]).toContain("enabled: true");
    expect(files[".cursor/rules"]["test.mdc"]).toContain("Test rule");

    // Check Gemini settings
    const geminiSettings = JSON.parse(files[".gemini/settings.json"]);
    expect(geminiSettings.mcpServers).toEqual(config.mcp.mcpServers);

    // Check OpenCode config
    const openCodeConfig = JSON.parse(files["opencode.json"]);
    expect(openCodeConfig.mcp.test).toEqual({
      type: "local",
      command: ["test-cmd", "--test"],
    });
  });

  test("should handle empty configuration", async () => {
    const config: AIConfig = {
      instructions: "",
      rules: [],
      commands: [],
      mcp: { mcpServers: {} },
    };

    const files = await generateFiles(config);

    expect(files["CLAUDE.md"]).toBe("");
    expect(files["GEMINI.md"]).toBe("");
    expect(files["AGENTS.md"]).toBe("");

    const mcpConfig = JSON.parse(files[".mcp.json"]);
    expect(mcpConfig.mcpServers).toEqual({});

    expect(Object.keys(files[".cursor/rules"])).toHaveLength(0);
  });

  test("should generate new provider-specific files", async () => {
    const config: AIConfig = {
      instructions: "AI assistant instructions",
      rules: [
        {
          frontmatter: { name: "test-rule" },
          content: "Rule content",
          filename: "test.md",
        },
      ],
      commands: [
        {
          frontmatter: {},
          content: "Deploy command",
          filename: "deploy.md",
        },
        {
          frontmatter: {},
          content: "Test command",
          filename: "test.md",
        },
      ],
      mcp: {
        mcpServers: {
          jira: {
            command: "bun",
            args: ["mcps/jira.ts"],
          },
        },
      },
    };

    const files = await generateFiles(config);

    // Test new provider files are generated
    expect(files["WINDSURF.md"]).toBeDefined();
    expect(files["QODER.md"]).toBeDefined();
    expect(files["TRAE.md"]).toBeDefined();
    expect(files["JULES.md"]).toBeDefined();
    expect(files["QWEN.md"]).toBeDefined();

    // All instruction files should have the same content
    const expectedContent = files["CLAUDE.md"];
    expect(files["WINDSURF.md"]).toBe(expectedContent);
    expect(files["QODER.md"]).toBe(expectedContent);
    expect(files["TRAE.md"]).toBe(expectedContent);
    expect(files["JULES.md"]).toBe(expectedContent);
    expect(files["QWEN.md"]).toBe(expectedContent);
  });

  test("should generate Copilot CLI agent files", async () => {
    const config: AIConfig = {
      instructions: "Copilot instructions",
      rules: [
        {
          frontmatter: { role: "planner" },
          content: "Planning agent content",
          filename: "planner.md",
        },
      ],
      commands: [],
      mcp: { mcpServers: {} },
    };

    const files = await generateFiles(config);

    // Check .copilot/agents directory
    expect(files[".copilot/agents"]).toBeDefined();
    expect(files[".copilot/agents"]["planner.md"]).toContain(
      "Planning agent content",
    );
  });

  test("should generate Kiro configuration files", async () => {
    const config: AIConfig = {
      instructions: "Kiro instructions",
      rules: [
        {
          frontmatter: { type: "spec" },
          content: "Feature specification",
          filename: "feature.md",
        },
      ],
      commands: [
        {
          frontmatter: { type: "hook" },
          content: "Pre-commit hook",
          filename: "pre-commit.md",
        },
      ],
      mcp: {
        mcpServers: {
          database: { command: "mcp-database" },
        },
      },
    };

    const files = await generateFiles(config);

    // Check Kiro directories
    expect(files[".kiro/specs"]).toBeDefined();
    expect(files[".kiro/hooks"]).toBeDefined();
    expect(files[".kiro/steering"]).toBeDefined();
    expect(files[".kiro/mcp.json"]).toBeDefined();

    const kiroMCP = JSON.parse(files[".kiro/mcp.json"]);
    expect(kiroMCP.mcpServers.database).toEqual({ command: "mcp-database" });
  });

  test("should generate VS Code Copilot configuration", async () => {
    const config: AIConfig = {
      instructions: "VS Code instructions",
      rules: [
        {
          frontmatter: { glob: "**/*.ts" },
          content: "TypeScript coding standards",
          filename: "typescript.md",
        },
      ],
      commands: [
        {
          frontmatter: { type: "prompt" },
          content: "Generate unit tests",
          filename: "gen-tests.md",
        },
      ],
      mcp: { mcpServers: {} },
    };

    const files = await generateFiles(config);

    // Check VS Code Copilot directories
    expect(files[".github/copilot-instructions.md"]).toBeDefined();
    expect(files[".github/copilot-prompts"]).toBeDefined();
    expect(files[".github/agents"]).toBeDefined();

    // Instructions should include all content
    expect(files[".github/copilot-instructions.md"]).toContain(
      "VS Code instructions",
    );
    expect(files[".github/copilot-instructions.md"]).toContain(
      "TypeScript coding standards",
    );
  });

  test("should generate Antigravity configuration", async () => {
    const config: AIConfig = {
      instructions: "Antigravity instructions",
      rules: [
        {
          frontmatter: { activation: "always" },
          content: "Global rule",
          filename: "global.md",
        },
      ],
      commands: [
        {
          frontmatter: { type: "workflow" },
          content: "Deploy workflow steps",
          filename: "deploy.md",
        },
      ],
      mcp: { mcpServers: {} },
    };

    const files = await generateFiles(config);

    // Check Antigravity directories
    expect(files[".agent/rules"]).toBeDefined();
    expect(files[".agent/workflows"]).toBeDefined();

    expect(files[".agent/rules"]["global.md"]).toContain("Global rule");
    expect(files[".agent/workflows"]["deploy.md"]).toContain(
      "Deploy workflow steps",
    );
  });

  test("should generate Dropstone workflows", async () => {
    const config: AIConfig = {
      instructions: "Dropstone instructions",
      rules: [],
      commands: [
        {
          frontmatter: { autonomous: true },
          content: "Autonomous workflow",
          filename: "auto-fix.md",
        },
      ],
      mcp: { mcpServers: {} },
    };

    const files = await generateFiles(config);

    // Check Dropstone directory
    expect(files[".dropstone/workflows"]).toBeDefined();
    expect(files[".dropstone/workflows"]["auto-fix.md"]).toContain(
      "Autonomous workflow",
    );
  });
});
