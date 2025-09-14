# SuperClaude MCP Server Configuration Guide

## Overview
This guide documents the complete MCP (Model Context Protocol) server configuration and specialized agents for SuperClaude framework.

## Current Configuration Status

### ✅ Successfully Configured MCP Servers

| Server | Package | Purpose | Status |
|--------|---------|---------|---------|
| **Context7** | `@upstash/context7-mcp` | Official library documentation lookup and framework patterns | ✅ Connected |
| **Magic** | `@21st-dev/magic` | UI component generation from 21st.dev patterns | ✅ Connected |
| **Playwright** | `@playwright/mcp` | Browser automation and E2E testing | ✅ Connected |
| **Sequential** | `@modelcontextprotocol/server-sequential-thinking` | Multi-step reasoning and complex analysis | ✅ Connected |
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | File operations and code management | ✅ Connected |

### ✅ Successfully Configured Specialized Agents

| Agent | Purpose | Use Cases | Status |
|-------|---------|-----------|--------|
| **backend-architect** | Design reliable backend systems with focus on data integrity | API design, database architecture, security patterns | ✅ Available |
| **code-reviewer** | Expert code review feedback on recently written code | Code quality assessment, best practices validation | ✅ Available |
| **devops-architect** | Automate infrastructure and deployment processes | CI/CD pipelines, containerization, monitoring | ✅ Available |
| **frontend-architect** | Create accessible, performant user interfaces | React/Vue components, responsive design, UX patterns | ✅ Available |
| **learning-guide** | Teach programming concepts through progressive learning | Code explanation, concept tutorials, skill building | ✅ Available |
| **performance-engineer** | Optimize system performance through measurement-driven analysis | Bottleneck identification, performance tuning, profiling | ✅ Available |
| **python-expert** | Deliver production-ready, secure Python code following SOLID principles | Django/FastAPI development, data processing, testing | ✅ Available |
| **quality-engineer** | Ensure software quality through comprehensive testing strategies | Test automation, quality assurance, edge case detection | ✅ Available |
| **refactoring-expert** | Improve code quality and reduce technical debt | Code cleanup, architecture improvements, maintainability | ✅ Available |
| **requirements-analyst** | Transform ambiguous project ideas into concrete specifications | Requirements discovery, project scoping, documentation | ✅ Available |
| **root-cause-analyst** | Systematically investigate complex problems | Bug investigation, system failure analysis, troubleshooting | ✅ Available |
| **security-engineer** | Identify security vulnerabilities and ensure compliance | Security audits, vulnerability assessment, compliance checks | ✅ Available |
| **socratic-mentor** | Educational guide using Socratic method for programming knowledge | Interactive learning, concept discovery, skill development | ✅ Available |
| **system-architect** | Design scalable system architecture with focus on maintainability | System design, architecture planning, technology selection | ✅ Available |
| **technical-writer** | Create clear, comprehensive technical documentation | API docs, user guides, architectural documentation | ✅ Available |

### ⚠️ Unavailable Servers with Alternatives

| Requested Server | Alternative Solution | Reason |
|-----------------|---------------------|---------|
| **Morphllm** | Filesystem MCP + Native MultiEdit | Morphllm package not available in npm registry |
| **Serena** | Filesystem MCP + Sequential | Serena package not available in npm registry |

## Installation Commands

### Install Specialized Agents
```bash
# Clone the agents repository to make them available
cd ~/.claude
git clone https://github.com/wshobson/agents.git

# Verify agents are available
ls ~/.claude/agents/
```

**Note**: Agents are automatically available once placed in `~/.claude/agents/` directory. No additional configuration required.

### Add MCP Servers to Claude Code
```bash
# Context7 - Documentation Lookup
claude mcp add context7 "npx" "@upstash/context7-mcp"

# Magic - UI Components from 21st.dev
claude mcp add magic "npx" "@21st-dev/magic"

# Playwright - Browser Automation
claude mcp add playwright "npx" "@playwright/mcp"

# Sequential - Multi-step Reasoning
claude mcp add sequential "npx" "@modelcontextprotocol/server-sequential-thinking"

# Filesystem - File Operations (with access to D:\ drive)
claude mcp add filesystem "npx" "@modelcontextprotocol/server-filesystem" "D:\\"
```

### Verify Installation
```bash
# List all configured MCP servers
claude mcp list

# Check specific server details
claude mcp get context7
claude mcp get magic
claude mcp get playwright
claude mcp get sequential
claude mcp get filesystem
```

## MCP Server Capabilities

### 1. Context7 (`mcp__context7`)
**Purpose**: Official documentation lookup and framework pattern guidance

**Key Functions**:
- `resolve-library-id`: Find Context7-compatible library IDs
- `get-library-docs`: Fetch up-to-date documentation

**Use Cases**:
- Framework documentation (React, Vue, Angular, Next.js)
- Library API references
- Best practices and official patterns
- Version-specific implementations

### 2. Magic (`mcp__magic`)
**Purpose**: Modern UI component generation from 21st.dev patterns

**Key Functions**:
- Generate production-ready UI components
- Implement accessible, responsive designs
- Create consistent design systems

**Use Cases**:
- Login forms, modals, navigation bars
- Data tables with sorting/filtering
- Responsive layouts
- Accessibility compliance

### 3. Playwright (`mcp__playwright`)
**Purpose**: Browser automation and E2E testing

**Key Functions**:
- `browser_navigate`: Navigate to URLs
- `browser_click`: Click elements
- `browser_type`: Type text
- `browser_snapshot`: Capture page state
- `browser_take_screenshot`: Visual testing
- `browser_fill_form`: Form automation
- `browser_wait_for`: Wait conditions

**Use Cases**:
- End-to-end testing
- Visual regression testing
- Form submission testing
- Cross-browser compatibility
- Accessibility testing

### 4. Sequential (`mcp__sequential`)
**Purpose**: Multi-step reasoning for complex analysis

**Key Functions**:
- `sequentialthinking`: Structured problem-solving with thought chains

**Use Cases**:
- Complex debugging
- System design
- Architecture analysis
- Performance optimization
- Security assessments

### 5. Filesystem (`mcp__filesystem`)
**Purpose**: Enhanced file operations (Alternative to Morphllm/Serena)

**Key Functions**:
- Advanced file operations
- Directory management
- Pattern-based file modifications

**Use Cases**:
- Bulk file operations
- Code refactoring
- File system navigation
- Project structure management

## Specialized Agent Capabilities

### Architecture & Design Agents

#### 1. System Architect
**Purpose**: Design scalable system architecture with focus on maintainability
**Tools**: Read, Grep, Glob, Write, Bash
**Use Cases**: System design, architecture planning, technology selection

#### 2. Backend Architect  
**Purpose**: Design reliable backend systems with focus on data integrity
**Tools**: Read, Write, Edit, MultiEdit, Bash, Grep
**Use Cases**: API design, database architecture, security patterns

#### 3. Frontend Architect
**Purpose**: Create accessible, performant user interfaces
**Tools**: Read, Write, Edit, MultiEdit, Bash
**Use Cases**: React/Vue components, responsive design, UX patterns

#### 4. DevOps Architect
**Purpose**: Automate infrastructure and deployment processes
**Tools**: Read, Write, Edit, Bash
**Use Cases**: CI/CD pipelines, containerization, monitoring

### Code Quality & Development Agents

#### 5. Code Reviewer
**Purpose**: Expert code review feedback on recently written code
**Tools**: All tools (comprehensive access)
**Use Cases**: Code quality assessment, best practices validation, pre-commit reviews

#### 6. Python Expert
**Purpose**: Deliver production-ready, secure Python code following SOLID principles
**Tools**: Read, Write, Edit, MultiEdit, Bash, Grep
**Use Cases**: Django/FastAPI development, data processing, testing

#### 7. Quality Engineer
**Purpose**: Ensure software quality through comprehensive testing strategies
**Tools**: Read, Write, Bash, Grep
**Use Cases**: Test automation, quality assurance, edge case detection

#### 8. Refactoring Expert
**Purpose**: Improve code quality and reduce technical debt
**Tools**: Read, Edit, MultiEdit, Grep, Write, Bash
**Use Cases**: Code cleanup, architecture improvements, maintainability

### Analysis & Problem Solving Agents

#### 9. Root Cause Analyst
**Purpose**: Systematically investigate complex problems
**Tools**: Read, Grep, Glob, Bash, Write
**Use Cases**: Bug investigation, system failure analysis, troubleshooting

#### 10. Performance Engineer
**Purpose**: Optimize system performance through measurement-driven analysis
**Tools**: Read, Grep, Glob, Bash, Write
**Use Cases**: Bottleneck identification, performance tuning, profiling

#### 11. Security Engineer
**Purpose**: Identify security vulnerabilities and ensure compliance
**Tools**: Read, Grep, Glob, Bash, Write
**Use Cases**: Security audits, vulnerability assessment, compliance checks

#### 12. Requirements Analyst
**Purpose**: Transform ambiguous project ideas into concrete specifications
**Tools**: Read, Write, Edit, TodoWrite, Grep, Bash
**Use Cases**: Requirements discovery, project scoping, documentation

### Education & Documentation Agents

#### 13. Technical Writer
**Purpose**: Create clear, comprehensive technical documentation
**Tools**: Read, Write, Edit, Bash
**Use Cases**: API docs, user guides, architectural documentation

#### 14. Learning Guide
**Purpose**: Teach programming concepts through progressive learning
**Tools**: Read, Write, Grep, Bash
**Use Cases**: Code explanation, concept tutorials, skill building

#### 15. Socratic Mentor
**Purpose**: Educational guide using Socratic method for programming knowledge
**Tools**: Read, Write, Grep, Bash
**Use Cases**: Interactive learning, concept discovery, skill development

## Usage Patterns for SuperClaude

### Agent Invocation
**Automatic Selection**: Claude Code automatically selects the appropriate agent based on your request
```
"Review this authentication code" → code-reviewer agent
"Design a scalable API architecture" → backend-architect agent
"Optimize this database query" → performance-engineer agent
```

**Manual Selection**: Specify which agent you want to use
```
"Use the python-expert agent to refactor this function"
"I need the security-engineer agent to audit this API"
"Have the technical-writer agent create documentation"
```

### MCP-Specific Flags
- `--c7` or `--context7`: Enable Context7 for documentation
- `--magic`: Enable Magic for UI components
- `--play` or `--playwright`: Enable Playwright for browser testing
- `--seq` or `--sequential`: Enable Sequential for analysis
- `--all-mcp`: Enable all MCP servers
- `--no-mcp`: Disable all MCP servers

### Analysis Depth Flags
- `--think`: Standard analysis (~4K tokens) with Sequential
- `--think-hard`: Deep analysis (~10K tokens) with Sequential + Context7
- `--ultrathink`: Maximum analysis (~32K tokens) with all MCP servers

### Agent Selection Guidelines

#### When to Use Specific Agents:

**Architecture Decision**: system-architect, backend-architect, frontend-architect, devops-architect
**Code Quality**: code-reviewer, quality-engineer, refactoring-expert
**Problem Solving**: root-cause-analyst, performance-engineer, security-engineer
**Learning & Documentation**: technical-writer, learning-guide, socratic-mentor
**Requirements**: requirements-analyst (for project scoping and discovery)
**Python Development**: python-expert (for production-ready Python code)

## Troubleshooting

### Common Issues and Solutions

1. **MCP Server Not Connecting**
   ```bash
   # Remove and re-add the server
   claude mcp remove [server-name]
   claude mcp add [server-name] "npx" "[package-name]"
   ```

2. **Permission Issues with Filesystem MCP**
   ```bash
   # Reconfigure with specific directory access
   claude mcp remove filesystem
   claude mcp add filesystem "npx" "@modelcontextprotocol/server-filesystem" "."
   ```

3. **Check MCP Server Health**
   ```bash
   claude mcp list
   # Look for ✓ Connected status
   ```

4. **Agent Not Available**
   ```bash
   # Verify agents directory exists and contains .md files
   ls ~/.claude/agents/
   
   # Re-clone if missing
   cd ~/.claude && git clone https://github.com/wshobson/agents.git
   ```

## Best Practices

1. **Tool Selection Priority**:
   - Use specialized agents for domain expertise
   - Use MCP servers over native tools when available
   - Context7 > WebSearch for documentation
   - Magic > manual HTML/CSS for UI components
   - Sequential > native reasoning for complex analysis
   - Playwright > unit tests for E2E testing

2. **Agent and MCP Integration**:
   - Combine agents with MCP servers for enhanced capabilities
   - Example: backend-architect + context7 for framework-specific patterns
   - Example: code-reviewer + sequential for deep code analysis

3. **Performance Optimization**:
   - Use parallel MCP operations when possible
   - Batch operations for efficiency
   - Enable specific MCP servers based on task requirements

4. **Session Management**:
   - Use `/sc:load` at session start
   - Regular checkpoints with `/sc:save`
   - Clean up resources at session end

## Future Enhancements

### Potential Additional MCP Servers
- **IDE MCP**: When available, for enhanced IDE-like capabilities
- **Morphllm**: When released, for pattern-based code editing
- **Serena**: When released, for semantic code understanding

### Potential Additional Agents
- **database-architect**: For database design and optimization
- **mobile-architect**: For mobile app development patterns
- **ai-engineer**: For ML/AI system development
- **accessibility-engineer**: For WCAG compliance and inclusive design

### Monitoring for Updates
```bash
# Check for new MCP servers periodically
npm search mcp modelcontextprotocol

# Check for updates to existing servers
npm outdated -g

# Update agents repository
cd ~/.claude/agents && git pull origin main
```

## Configuration Files

The MCP and agent configuration is stored in:
- **MCP User Config**: `C:\Users\githu\.claude.json`
- **MCP Project Config**: `.mcp.json` (if project-specific servers are needed)
- **Agents Directory**: `C:\Users\githu\.claude\agents\` (contains all .md agent files)

## Support and Resources

- **Claude Code Documentation**: https://docs.anthropic.com/en/docs/claude-code
- **MCP Protocol Spec**: https://modelcontextprotocol.io
- **SuperClaude Framework**: See docs/superclaude-framework-guide.md
- **Agents Repository**: https://github.com/wshobson/agents
- **Issue Reporting**: https://github.com/anthropics/claude-code/issues

## Quick Reference

### Invoke an Agent
```
"Review this authentication code" → Automatic code-reviewer selection
"Use the python-expert agent to refactor this function" → Manual selection
```

### Check Available Resources
```bash
# List MCP servers
claude mcp list

# List available agents
ls ~/.claude/agents/

# Check agent content
cat ~/.claude/agents/code-reviewer.md
```

---

*Last Updated: 2025-09-09*
*Configuration verified with Claude Code v1.0.84*
*Includes 5 MCP servers + 15 specialized agents*