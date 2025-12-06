# AI Provider Compatibility Research

This document outlines the configuration file formats and locations for all supported AI coding assistants.

## Summary Table

| Provider               | Instructions                    | Rules/Agents       | Commands/Workflows       | MCP Support        | Special Features                              |
| ---------------------- | ------------------------------- | ------------------ | ------------------------ | ------------------ | --------------------------------------------- |
| **Windsurf**           | Memories                        | Built-in           | -                        | ✅ MCP servers     | Cascade agent, memories                       |
| **Qoder**              | Chat context                    | -                  | Quest Mode               | ✅ MCP servers     | Quest Mode, Repo Wiki                         |
| **TRAE**               | Built-in                        | Agents             | CUE tool                 | -                  | SOLO mode, dual development modes             |
| **Jules**              | -                               | AGENTS.md          | -                        | -                  | Virtual machine execution, GitHub integration |
| **Qwen Code**          | REPL                            | -                  | Custom commands          | ✅ OpenAI protocol | SubAgent support, free 2000 daily requests    |
| **Gemini CLI**         | -                               | -                  | Custom commands          | ✅ MCP servers     | REPL, checkpointing, sandboxing               |
| **GitHub Copilot CLI** | -                               | ~/.copilot/agents/ | -                        | ✅ MCP servers     | Session management, custom agents             |
| **Kiro**               | Steering                        | -                  | Hooks                    | ✅ MCP servers     | Specs, hooks, steering, privacy-first         |
| **VS Code Copilot**    | .github/copilot-instructions.md | .github/agents/    | .github/copilot-prompts/ | ✅ MCP servers     | Custom agents, prompt files, language models  |
| **Antigravity**        | ~/.gemini/GEMINI.md             | .agent/rules/      | .agent/workflows/        | ✅ MCP servers     | Task groups, browser subagent                 |
| **Dropstone**          | -                               | -                  | Autonomous workflows     | -                  | AGI capabilities, self-learning               |

---

## Detailed Provider Analysis

### 1. Windsurf

**Documentation:** https://docs.windsurf.com/

#### Configuration Files:

- **Memories**: Cascade can store and recall information
- **MCP Servers**: Extends agent capabilities
- **Settings**: Import from VS Code/Cursor

#### Features:

- Cascade: Agentic chatbot
- Context awareness
- Terminal integration
- Workflows automation
- App deploys

#### File Structure:

```
project/
├── .windsurf/
│   ├── mcp.json          # MCP server configurations
│   └── memories/          # Stored memories
```

---

### 2. Qoder

**Documentation:** https://docs.qoder.com/

#### Configuration Files:

- **Quest Mode**: Asynchronous development tasks
- **Repo Wiki**: Project structure analysis
- **MCP Servers**: External tools and services

#### Features:

- Quest Mode: Delegate complex tasks
- Enhanced context engineering
- Repo Wiki: Deep code analysis
- CLI support
- JetBrains plugin

#### File Structure:

```
project/
├── .qoder/
│   └── mcp.json          # MCP server configurations
```

---

### 3. TRAE

**Documentation:** https://docs.trae.ai/

#### Configuration Files:

- **Agent System**: Freely configurable agents
- **CUE**: Agent programming tool
- **SOLO Mode**: AI-led development

#### Features:

- SOLO Coder: Complex project development
- SOLO Builder: Rapid web app building
- Dual development modes (IDE + SOLO)
- Agent marketplace

#### File Structure:

```
project/
├── .trae/
│   └── agents/           # Custom agents
```

---

### 4. Jules (Google)

**Documentation:** https://jules.google/docs

#### Configuration Files:

- **AGENTS.md**: Agent/tool descriptions in repository root

#### Features:

- Virtual machine execution
- GitHub integration
- Environment setup scripts
- Task planning and execution
- Browser notifications

#### File Structure:

```
project/
├── AGENTS.md             # Agent descriptions (automatically detected)
```

---

### 5. Qwen Code

**Documentation:** https://qwenlm.github.io/qwen-code-docs/

#### Configuration Files:

- **Custom commands**: REPL environment
- **SubAgent support**: Specialized development tasks
- **OpenAI Protocol**: Compatible with multiple AI providers

#### Features:

- Interactive REPL
- File system operations
- SubAgent support
- 2000 free daily requests via QwenChat OAuth
- MIT licensed

#### File Structure:

```
~/.qwen-code/
├── config.json           # Configuration
└── commands/             # Custom commands
```

---

### 6. Gemini CLI

**Documentation:** https://geminicli.com/docs/

#### Configuration Files:

- **Custom commands**: Frequently used prompts
- **Settings**: ~/.gemini/settings.json
- **MCP Servers**: External tool integration

#### Features:

- Interactive REPL
- Checkpointing
- Sandbox mode
- Token caching
- Trusted folders
- Themes

#### File Structure:

```
~/.gemini/
├── settings.json         # CLI settings
├── commands/             # Custom commands
└── mcp-config.json       # MCP server configurations
```

---

### 7. GitHub Copilot CLI

**Documentation:** https://github.com/features/copilot/cli

#### Configuration Files:

- **~/.copilot/agents/**: User-defined custom agents
- **~/.copilot/config**: User preferences and model selection
- **~/.copilot/mcp-config.json**: MCP server configurations
- **.github/agents/**: Repository-specific agents

#### Features:

- Session management
- Custom agents (user, repo, org-level)
- MCP server support
- Model selection
- Tool allow/deny lists

#### File Structure:

```
~/.copilot/
├── config                # User preferences
├── agents/               # User-defined agents
├── mcp-config.json       # MCP configurations
└── session-state         # Session history

project/
├── .github/
│   └── agents/           # Repository-specific agents
```

---

### 8. Kiro

**Documentation:** https://kiro.dev/docs/

#### Configuration Files:

- **Specs**: Structured feature specifications
- **Hooks**: Automated task triggers
- **Steering**: Custom rules and context
- **MCP Servers**: External tools

#### Features:

- Specs-based planning
- Hooks automation
- Agentic chat
- Privacy-first approach
- IDE and CLI versions

#### File Structure:

```
project/
├── .kiro/
│   ├── specs/            # Feature specifications
│   ├── hooks/            # Automation hooks
│   ├── steering/         # Custom rules
│   └── mcp.json          # MCP server configurations
```

---

### 9. VS Code Copilot

**Documentation:** https://code.visualstudio.com/docs/copilot/customization/

#### Configuration Files:

- **.github/copilot-instructions.md**: Custom instructions (glob patterns supported)
- **.github/copilot-prompts/**: Reusable prompt files
- **.github/agents/**: Custom agents

#### Features:

- Custom instructions with glob patterns
- Prompt files for common tasks
- Custom agents for specialized roles
- Language model selection
- MCP servers and tools

#### File Structure:

```
project/
├── .github/
│   ├── copilot-instructions.md    # Global instructions
│   ├── src/
│   │   └── copilot-instructions.md # Path-specific instructions
│   ├── copilot-prompts/           # Reusable prompts
│   │   ├── generate-tests.md
│   │   └── code-review.md
│   └── agents/                    # Custom agents
│       ├── planner.md
│       └── frontend-dev.md
```

---

### 10. Antigravity (Google)

**Documentation:** https://antigravity.google/docs/

#### Configuration Files:

- **~/.gemini/GEMINI.md**: Global rules
- **.agent/rules/**: Workspace-specific rules
- **.agent/workflows/**: Reusable workflows

#### Features:

- Global and workspace rules
- Manual, Always On, Model Decision, Glob activation
- Workflows with slash commands
- Task groups
- Browser subagent
- MCP support

#### File Structure:

```
~/.gemini/
└── GEMINI.md             # Global rules

project/
├── .agent/
│   ├── rules/            # Workspace rules (12,000 char limit each)
│   │   ├── general.md
│   │   └── forms.md
│   └── workflows/        # Workflows (12,000 char limit each)
│       ├── deploy.md
│       └── pr-review.md
```

---

### 11. Dropstone

**Documentation:** https://docs.dropstone.io/

#### Configuration Files:

- **Autonomous workflows**: Self-learning capabilities
- **Agent modes**: Different operation modes

#### Features:

- AGI-powered autonomous coding
- Self-learning capabilities
- Autonomous workflows
- Intelligent code generation
- VS Code integration

#### File Structure:

```
project/
├── .dropstone/
│   └── workflows/        # Autonomous workflows
```

---

## Mapping to .ai/ Structure

All provider configurations will be unified under the `.ai/` directory:

```
.ai/
├── instructions.md       # Main instructions (all providers)
├── rules/                # Rules and agents (*.md files)
├── commands/             # Commands, prompts, workflows (*.md files)
├── specs/                # Feature specifications (Kiro)
├── hooks/                # Automation hooks (Kiro)
├── steering/             # Steering rules (Kiro)
└── mcp.json              # Unified MCP server configurations
```

### Generation Outputs:

```
# General instructions
CLAUDE.md, GEMINI.md, AGENTS.md, WINDSURF.md, QODER.md, TRAE.md, JULES.md, QWEN.md

# Provider-specific structures
.cursor/rules/            → Cursor
.gemini/settings.json     → Gemini
.mcp.json                 → Multiple providers
opencode.json             → OpenCode
.copilot/agents/          → GitHub Copilot CLI
.kiro/                    → Kiro
.github/                  → VS Code Copilot
.agent/                   → Antigravity
.dropstone/               → Dropstone
```

---

## Migration Strategy

The migration process will:

1. **Detect** existing provider files
2. **Extract** content from each provider's format
3. **Merge** into unified `.ai/` structure
4. **Generate** all provider-specific outputs from `.ai/`

This ensures:

- ✅ Single source of truth (`.ai/` directory)
- ✅ Support for all major AI coding assistants
- ✅ Easy switching between providers
- ✅ Unified MCP server management
- ✅ No duplicate configurations
