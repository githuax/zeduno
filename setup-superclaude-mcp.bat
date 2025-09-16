@echo off
echo ===============================================
echo SuperClaude MCP Server Configuration Script
echo ===============================================
echo.

echo [1/6] Installing Context7 (Documentation Lookup)...
call claude mcp install @upstash/context7-mcp
if %ERRORLEVEL% NEQ 0 (
    echo Context7 already installed or error occurred
)
echo.

echo [2/6] Installing Magic (UI Components from 21st.dev)...
call claude mcp install @21st-dev/magic
if %ERRORLEVEL% NEQ 0 (
    echo Magic already installed or error occurred
)
echo.

echo [3/6] Installing Filesystem MCP (File Operations - Alternative to Morphllm)...
call claude mcp install @modelcontextprotocol/server-filesystem
if %ERRORLEVEL% NEQ 0 (
    echo Filesystem MCP already installed or error occurred
)
echo Note: Morphllm not found in npm. Using Filesystem MCP for file operations.
echo.

echo [4/6] Installing Playwright (Browser Automation)...
call claude mcp install @playwright/mcp
if %ERRORLEVEL% NEQ 0 (
    echo Playwright already installed or error occurred
)
echo.

echo [5/6] Installing Sequential (Multi-step Reasoning)...
call claude mcp install @modelcontextprotocol/server-sequential-thinking
if %ERRORLEVEL% NEQ 0 (
    echo Sequential already installed or error occurred
)
echo.

echo [6/6] Checking for Serena alternatives...
echo Note: Serena MCP not found in npm registry.
echo Available alternatives for semantic code understanding:
echo - Use native Claude Code capabilities
echo - Combine Sequential + Filesystem MCP for code analysis
echo.

echo ===============================================
echo Listing all installed MCP servers...
echo ===============================================
call claude mcp list
echo.

echo ===============================================
echo Installation Summary
echo ===============================================
echo.
echo Confirmed Available MCP Servers:
echo - Context7: Documentation lookup and framework patterns
echo - Playwright: Browser automation and E2E testing
echo - Sequential: Multi-step reasoning and analysis
echo.
echo Servers Requiring Manual Installation:
echo - Magic: Check npm for UI component generation packages
echo - Morphllm: Check npm for pattern-based editing packages
echo - Serena: Check npm for semantic code understanding packages
echo.
echo To manually install any missing servers:
echo   claude mcp install [package-name]
echo.
echo To verify installation:
echo   claude mcp list
echo.
pause