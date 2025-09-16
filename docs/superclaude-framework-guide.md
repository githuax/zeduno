# 🧠 SuperClaude Framework Guide

## Quick Start

SuperClaude enhances Claude Code with behavioral modes, MCP server integrations, and advanced analysis capabilities. Start with these essential flags:

```bash
# Documentation & Library Help
--c7                 # Context7 for official docs

# Planning & Organization  
--brainstorm         # Requirements discovery
--task-manage        # Hierarchical task tracking

# Execution & Optimization
--orchestrate        # Intelligent tool selection
--uc                 # Ultra-compressed output

# Analysis Depth
--think              # Standard analysis
--think-hard         # Deep analysis
--ultrathink         # Maximum analysis
```

---

## 🎯 Core Behavioral Modes

### 1. **Brainstorming Mode** `--brainstorm` / `--bs`

**Purpose:** Transform vague ideas into clear, actionable requirements through collaborative discovery.

**When to Use:**
- Starting new projects without clear specifications
- Exploring possibilities and alternatives
- Requirements gathering sessions
- "I want to build something..." scenarios

**How It Works:**
```
User: "I'm thinking about building some kind of dashboard"

Claude (--brainstorm):
🤔 Let's explore this together:

**Core Questions:**
1. What's the primary purpose of this dashboard?
   - Monitoring? Analytics? Administration?
   
2. Who will use it?
   - Internal team? Customers? Both?
   
3. What data needs visualization?
   - Real-time metrics? Historical trends?
   
4. Any existing systems to integrate?
   - Databases? APIs? Third-party services?

📝 Once we clarify these, I'll create a structured requirements brief.
```

**Outcomes:**
- Clear project requirements from vague concepts
- Structured briefs ready for implementation
- Reduced scope creep through upfront exploration
- Better alignment with actual needs

---

### 2. **Task Management Mode** `--task-manage` / `--delegate`

**Purpose:** Organize complex work into hierarchical, trackable tasks with persistent memory across sessions.

**When to Use:**
- Projects with >3 steps
- Multi-file operations (>3 files or >2 directories)
- Need to resume work across sessions
- Complex refactoring or implementations

**Task Hierarchy:**
```
📋 Plan (Overall Goal)
└── 🎯 Phase (Major Milestone)
    └── 📦 Task (Specific Deliverable)
        └── ✓ Todo (Atomic Action)
```

**Real-World Example:**
```bash
User: "Implement complete authentication system with JWT"

Claude (--task-manage):
📋 Creating comprehensive task plan...

**Phase 1: Analysis & Design** 🎯
├── Task 1.1: Analyze current auth setup
│   ├── ✓ Review existing auth code
│   ├── ✓ Document security requirements
│   └── ✓ Research JWT best practices
├── Task 1.2: Design token strategy
│   ├── ⏳ Define token structure
│   ├── ⏳ Plan refresh mechanism
│   └── ⏳ Design revocation system

**Phase 2: Implementation** 🎯
├── Task 2.1: Core JWT middleware
│   ├── ⏳ Create token generator
│   ├── ⏳ Build verification logic
│   └── ⏳ Add error handling
├── Task 2.2: User endpoints
│   ├── ⏳ Login endpoint
│   ├── ⏳ Refresh endpoint
│   └── ⏳ Logout endpoint

**Phase 3: Testing & Security** 🎯
├── Task 3.1: Unit tests
├── Task 3.2: Integration tests
└── Task 3.3: Security audit

[Starting with Task 1.1...]
```

**Session Persistence:**
```bash
# Session 1: Start work
list_memories() → Empty
write_memory("plan_auth", "JWT implementation")
# Work on Phase 1...

# Session 2: Resume next day
list_memories() → Shows progress
read_memory("plan_auth") → Continue from Phase 2
think_about_collected_information() → Pick up where left off
```

---

### 3. **Orchestration Mode** `--orchestrate`

**Purpose:** Intelligently select and coordinate the best tools for each task, maximizing efficiency through parallel execution.

**When to Use:**
- Multi-tool operations
- Performance-critical tasks
- Resource-constrained environments (>75% context usage)
- Complex problems requiring specialized tools

**Tool Selection Matrix:**

| Task | Primary Tool | Why | Alternative |
|------|-------------|-----|-------------|
| **UI Components** | Magic MCP | Pre-built, accessible | Manual HTML/CSS |
| **Documentation** | Context7 (`--c7`) | Official, versioned | WebSearch |
| **Deep Analysis** | Sequential | Structured reasoning | Native analysis |
| **Browser Testing** | Playwright | Real browser | Unit tests |
| **Bulk Edits** | MultiEdit | Atomic, efficient | Sequential edits |
| **Code Search** | Grep tool | Optimized | bash grep |

**Orchestration Examples:**

**Example 1: Full-Stack Feature Development**
```bash
User: "Add real-time notifications to the dashboard"

Claude (--orchestrate):
🎼 Orchestrating optimal tool combination...

**Parallel Group 1:** (Research Phase)
├── Context7: Socket.io documentation
├── Grep: Find existing WebSocket code
└── Sequential: Analyze current architecture

**Sequential Group 2:** (Implementation)
1. Backend WebSocket server (MultiEdit)
2. Frontend connection logic (MultiEdit)  
3. UI notification component (Magic MCP)

**Parallel Group 3:** (Validation)
├── Playwright: Test real-time updates
├── Sequential: Performance analysis
└── Grep: Verify error handling

Efficiency gain: 65% time saved via parallelization
```

**Example 2: Performance-Constrained Refactoring**
```bash
Context at 78% → Yellow Zone Activated

Claude (--orchestrate):
⚠️ Switching to efficiency mode...

**Adaptive Strategy:**
❌ Disabled: Sequential (token-heavy)
✅ Enabled: --uc flag (30% compression)
✅ Using: Batch operations only

**Execution Plan:**
1. Compress analysis output
2. Process 10 files per batch
3. Defer non-critical validation
4. Fall back to essential-only if >85%
```

**Resource Management Zones:**

```
🟢 Green (0-75%): Full capabilities
├── All tools available
├── Detailed analysis
└── Normal verbosity

🟡 Yellow (75-85%): Efficiency mode
├── Enable --uc compression
├── Prioritize essential tasks
└── Batch operations

🔴 Red (85%+): Critical mode
├── Essential operations only
├── Ultra-compressed output
└── Suggest session split
```

---

### 4. **Context7 Integration** `--c7` / `--context7`

**Purpose:** Access official, up-to-date documentation for libraries and frameworks.

**When to Use:**
- Implementing framework-specific features
- Need official API references
- Version-specific implementations
- Best practices and patterns

**Key Advantages:**
- ✅ Official documentation (not outdated blog posts)
- ✅ Version-specific information
- ✅ Curated, accurate examples
- ✅ Framework-compliant patterns

**Usage Examples:**

```bash
# React Hooks Implementation
User: "Implement data fetching with React hooks"

Claude (--c7):
🔍 Fetching official React documentation...

[Context7 returns latest useEffect patterns]

Here's the official pattern for data fetching:
```

```bash
# Library Migration
User: "Migrate from Vue 2 to Vue 3"

Claude (--c7):
📚 Accessing Vue 3 migration guide...

[Context7 provides official migration steps]

Following the official migration path:
1. Composition API changes...
2. Breaking changes list...
3. Migration build setup...
```

**Context7 vs Other Sources:**

| Need | Use Context7 | Don't Use Context7 |
|------|-------------|-------------------|
| React hooks patterns | ✅ Yes | WebSearch (outdated) |
| Auth0 integration | ✅ Yes | Generic auth guides |
| Next.js optimization | ✅ Yes | General performance tips |
| Algorithm explanation | ❌ No | Native knowledge |
| General concepts | ❌ No | Native explanation |

---

## 🔍 Analysis Depth Flags

### Progressive Analysis Levels

```bash
--think          # ~4K tokens - Multi-component analysis
--think-hard     # ~10K tokens - System-wide analysis  
--ultrathink     # ~32K tokens - Complete architecture review
```

**When to Use Each Level:**

| Flag | Use Case | Example |
|------|----------|---------|
| `--think` | Debugging specific feature | "Why is login slow?" |
| `--think-hard` | Cross-system issues | "Analyze API architecture" |
| `--ultrathink` | Major decisions | "Should we migrate to microservices?" |

---

## 💡 Token Efficiency Mode `--uc` / `--ultracompressed`

**Purpose:** Reduce token usage by 30-50% while maintaining clarity through symbols and abbreviations.

**Symbol Language:**

**Logic Flow:**
- → implies/leads to
- ⇒ transforms
- ← rollback
- ⇄ bidirectional
- ∴ therefore
- ∵ because

**Status Indicators:**
- ✅ complete
- ❌ failed
- ⚠️ warning
- 🔄 in progress
- ⏳ pending
- 🚨 critical

**Domain Symbols:**
- ⚡ performance
- 🛡️ security
- 🔧 config
- 📦 deployment
- 🎨 UI/design
- 🏗️ architecture

**Compression Examples:**

```bash
# Standard Output (156 tokens):
"The authentication system has multiple security vulnerabilities. 
The password validation is weak, there's no rate limiting on login 
attempts, and JWT tokens don't expire. Additionally, the system 
has performance issues with database queries taking too long."

# Compressed Output (52 tokens):
"Auth system issues:
🛡️ Security (3):
• pwd validation weak
• ❌ rate limiting
• JWT no expiry
⚡ Performance:
• DB queries slow

Fix priority: 🛡️ > ⚡"
```

---

## 🚀 Common Workflow Patterns

### 1. **New Project Start**
```bash
# Discovery → Planning → Implementation
--brainstorm              # Gather requirements
--task-manage            # Create task hierarchy
--orchestrate            # Execute efficiently
```

### 2. **Complex Debugging**
```bash
# Analysis → Investigation → Solution
--think-hard             # Deep analysis
--seq                    # Systematic investigation
--orchestrate           # Coordinate fixes
```

### 3. **UI Development**
```bash
# Design → Build → Test
--c7 --magic            # Docs + UI generation
--play                  # Browser testing
--uc                    # Efficient output
```

### 4. **Large Refactoring**
```bash
# Plan → Execute → Validate
--task-manage           # Track all changes
--orchestrate          # Parallel execution
--validate             # Safety checks
```

### 5. **Performance Crisis**
```bash
# Quick fixes when context is high
--uc --no-mcp --safe-mode
```

---

## 📊 MCP Server Configuration

### Currently Configured Servers

| Server | Package | Purpose | Status |
|--------|---------|---------|--------|
| **Context7** | `@upstash/context7-mcp` | Documentation | ✅ Active |
| **Magic** | `@21st-dev/magic` | UI Components | ✅ Active |
| **Playwright** | `@playwright/mcp` | Browser Testing | ✅ Active |
| **Sequential** | `@modelcontextprotocol/server-sequential-thinking` | Analysis | ✅ Active |
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | File Ops | ✅ Active |

### MCP Control Flags

```bash
--all-mcp         # Enable all MCP servers
--no-mcp          # Disable all MCP servers
--c7              # Context7 only
--magic           # Magic only
--play            # Playwright only
--seq             # Sequential only
```

---

## 🎯 Best Practices

### 1. **Start Simple**
Begin with basic operations, add flags as complexity grows:
```bash
Simple task → No flags
3+ steps → --task-manage
Multiple tools → --orchestrate
Need docs → --c7
```

### 2. **Combine Strategically**
Some flags work better together:
```bash
--brainstorm --task-manage    # Plan then organize
--c7 --magic                   # Docs + UI generation
--think-hard --seq             # Deep analysis
--orchestrate --uc             # Efficient execution
```

### 3. **Monitor Resources**
```bash
<75% context → Normal operation
75-85% → Add --uc flag
>85% → --uc --safe-mode
```

### 4. **Session Management**
```bash
Start: --task-manage (creates memory)
Work: Update todos regularly
Interrupt: Checkpoint automatically
Resume: Reads memory, continues
```

---

## 📚 Framework Components

### Core Files
- `CLAUDE.md` - Entry point and custom instructions
- `FLAGS.md` - All available flags and triggers  
- `PRINCIPLES.md` - Engineering philosophy
- `RULES.md` - Behavioral rules and priorities

### Mode Documentation
- `MODE_Brainstorming.md` - Discovery mode
- `MODE_Task_Management.md` - Task organization
- `MODE_Orchestration.md` - Tool coordination
- `MODE_Introspection.md` - Self-analysis
- `MODE_Token_Efficiency.md` - Compression

### MCP Documentation  
- `MCP_Context7.md` - Documentation server
- `MCP_Magic.md` - UI component server
- `MCP_Playwright.md` - Browser automation
- `MCP_Sequential.md` - Analysis engine
- `MCP_Filesystem.md` - File operations

---

## 🔧 Troubleshooting

### Common Issues

**"MCP server not responding"**
```bash
claude mcp list           # Check status
claude mcp remove [name]  # Remove
claude mcp add [name] ... # Re-add
```

**"Context usage too high"**
```bash
# Immediate: Add --uc flag
# Better: Split into sessions
# Best: Use --orchestrate for efficiency
```

**"Task lost between sessions"**
```bash
# Task management creates memory
# Always use --task-manage for multi-session work
list_memories()  # Check saved state
```

---

## 📈 Performance Tips

1. **Parallel Everything**: Use --orchestrate to identify parallel operations
2. **Batch Operations**: MultiEdit > multiple Edits
3. **Right Tool**: MCP servers > native tools > manual work
4. **Compress Early**: Use --uc before hitting 75% context
5. **Plan First**: --brainstorm and --task-manage prevent rework

---

**Version:** 2.0  
**Framework Location:** `C:\Users\githu\.claude\`  
**MCP Config:** `C:\Users\githu\.claude.json`  
**Last Updated:** 2025-09-07

*SuperClaude enhances Claude Code through behavioral patterns, tool integrations, and optimization strategies - not a separate AI model.*