#!/bin/bash
# =============================================================================
# Requirements Verification Script for mflix Sample Application
# JavaScript/Express Backend
# =============================================================================
#
# This script checks that all necessary requirements are installed to run
# the mflix sample application with the JavaScript/Express backend.
#
# Usage:
#   ./check-requirements-js.sh           # Check all requirements (post-setup)
#   ./check-requirements-js.sh --pre     # Check only runtime requirements (pre-setup)
#   ./check-requirements-js.sh --setup   # Check and auto-setup missing items
#   ./check-requirements-js.sh --help    # Show help message
#
# =============================================================================

# Exit on error (but handle arithmetic expressions carefully)
set -e

# =============================================================================
# Configuration
# =============================================================================

SERVER_DIR="server"
CLIENT_DIR="client"
NODE_MIN_VERSION="18"

# =============================================================================
# Colors
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Counters
# =============================================================================

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_section() {
    echo ""
    echo -e "${YELLOW}▸ $1${NC}"
}

check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    CHECKS_WARNED=$((CHECKS_WARNED + 1))
}

check_info() {
    echo -e "    ${BLUE}→${NC} $1"
}

command_exists() {
    command -v "$1" &>/dev/null
}

version_gte() {
    # Returns 0 (true) if $1 >= $2 (numeric comparison)
    [[ "$1" -ge "$2" ]] 2>/dev/null
}

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --pre      Check only runtime requirements (use before setup)"
    echo "  --setup    Attempt to automatically set up missing requirements"
    echo "  --help     Show this help message"
    echo ""
    echo "This script checks that all necessary requirements are installed"
    echo "to run the mflix sample application with the JavaScript/Express backend."
    echo ""
    echo "Use --pre before starting setup to verify you have the required runtime."
    echo "Use without flags after completing setup to verify everything is ready."
    exit 0
}

# =============================================================================
# Check Runtime Requirements (Pre-Setup)
# =============================================================================

check_runtime_requirements() {
    print_section "Runtime Requirements"

    # Check Node.js version
    if command_exists node; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local node_major
        node_major=$(echo "$node_version" | cut -d. -f1)
        if version_gte "$node_major" "$NODE_MIN_VERSION"; then
            check_pass "Node.js $node_version installed (>= $NODE_MIN_VERSION required)"
        else
            check_fail "Node.js $node_version installed but >= $NODE_MIN_VERSION required"
            check_info "Install Node.js $NODE_MIN_VERSION+: https://nodejs.org/"
        fi
    else
        check_fail "Node.js not installed"
        check_info "Install Node.js $NODE_MIN_VERSION+: https://nodejs.org/"
    fi

    # Check npm
    if command_exists npm; then
        local npm_version
        npm_version=$(npm --version)
        check_pass "npm installed (version $npm_version)"
    else
        check_fail "npm not installed"
        check_info "npm should come with Node.js installation"
    fi
}

# =============================================================================
# Check JavaScript/Express Backend Requirements (Full)
# =============================================================================

check_backend_requirements() {
    print_section "JavaScript/Express Backend Requirements"

    local server_dir="$SCRIPT_DIR/$SERVER_DIR"

    # Check Node.js version
    if command_exists node; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local node_major
        node_major=$(echo "$node_version" | cut -d. -f1)
        if [[ "$node_major" -ge "$NODE_MIN_VERSION" ]]; then
            check_pass "Node.js $node_version installed (>= $NODE_MIN_VERSION required)"
        else
            check_fail "Node.js $node_version installed but >= $NODE_MIN_VERSION required"
            check_info "Install Node.js $NODE_MIN_VERSION+ from https://nodejs.org/"
        fi
    else
        check_fail "Node.js not installed"
        check_info "Install Node.js $NODE_MIN_VERSION+ from https://nodejs.org/"
        return
    fi

    # Check npm
    if command_exists npm; then
        local npm_version
        npm_version=$(npm --version)
        check_pass "npm installed (version $npm_version)"
    else
        check_fail "npm not installed"
        check_info "npm should come with Node.js installation"
        return
    fi

    # Check server directory
    if [[ ! -d "$server_dir" ]]; then
        check_fail "Server directory not found: $SERVER_DIR"
        return
    fi

    # Check package.json
    if [[ -f "$server_dir/package.json" ]]; then
        check_pass "package.json found"
    else
        check_fail "package.json not found in $SERVER_DIR"
        return
    fi

    # Check node_modules
    if [[ -d "$server_dir/node_modules" ]]; then
        check_pass "node_modules directory exists"

        # Check Express.js
        if [[ -d "$server_dir/node_modules/express" ]]; then
            check_pass "Express.js dependency installed"
        else
            check_fail "Express.js dependency not installed"
        fi

        # Check MongoDB driver
        if [[ -d "$server_dir/node_modules/mongodb" ]]; then
            check_pass "MongoDB driver dependency installed"
        else
            check_fail "MongoDB driver dependency not installed"
        fi

        # Check TypeScript build
        if [[ -d "$server_dir/dist" ]]; then
            check_pass "TypeScript build output exists (dist directory)"
        else
            check_warn "TypeScript build output not found (dist directory)"
            check_info "Run: cd $SERVER_DIR && npm run build"
        fi
    else
        check_warn "node_modules directory not found"
        if [[ "$SETUP_MODE" == true ]]; then
            check_info "Installing dependencies..."
            if (cd "$server_dir" && npm install &>/dev/null); then
                check_pass "Dependencies installed successfully"
            else
                check_fail "Failed to install dependencies"
            fi
        else
            check_info "Run: cd $SERVER_DIR && npm install"
        fi
    fi
}

# =============================================================================
# Check Environment Configuration
# =============================================================================

check_env_configuration() {
    print_section "Environment Configuration"

    local server_dir="$SCRIPT_DIR/$SERVER_DIR"
    local env_file="$server_dir/.env"
    local env_example="$server_dir/.env.example"

    # Check .env file
    if [[ -f "$env_file" ]]; then
        check_pass ".env file exists"

        # Check MONGODB_URI
        if grep -q "^MONGODB_URI=" "$env_file" 2>/dev/null; then
            local mongo_uri
            mongo_uri=$(grep "^MONGODB_URI=" "$env_file" | cut -d'=' -f2-)
            if [[ -n "$mongo_uri" ]] && [[ "$mongo_uri" != *"<"*">"* ]]; then
                check_pass "MONGODB_URI is configured"
            else
                check_fail "MONGODB_URI is not configured (still has placeholder value)"
                check_info "Update MONGODB_URI in $SERVER_DIR/.env with your MongoDB connection string"
            fi
        else
            check_fail "MONGODB_URI not found in .env"
            check_info "Add MONGODB_URI to $SERVER_DIR/.env"
        fi

        # Check VOYAGE_API_KEY (optional)
        if grep -q "^VOYAGE_API_KEY=" "$env_file" 2>/dev/null; then
            local voyage_key
            voyage_key=$(grep "^VOYAGE_API_KEY=" "$env_file" | cut -d'=' -f2-)
            if [[ -n "$voyage_key" ]] && [[ "$voyage_key" != "your_voyage_api_key" ]]; then
                check_pass "VOYAGE_API_KEY is configured"
            else
                check_info "VOYAGE_API_KEY not configured (optional - needed for vector search)"
            fi
        else
            check_info "VOYAGE_API_KEY not set (optional - needed for vector search)"
        fi

        # Check CORS_ORIGINS (optional)
        if grep -q "^CORS_ORIGINS=" "$env_file" 2>/dev/null; then
            check_pass "CORS_ORIGINS is configured"
        else
            check_info "CORS_ORIGINS not set (will use default: http://localhost:3000)"
        fi

        # Check PORT (optional)
        if grep -q "^PORT=" "$env_file" 2>/dev/null; then
            check_pass "PORT is configured"
        else
            check_info "PORT not set (will use default: 3001)"
        fi
    else
        check_warn ".env file not found"
        if [[ -f "$env_example" ]]; then
            if [[ "$SETUP_MODE" == true ]]; then
                check_info "Creating .env from .env.example..."
                if cp "$env_example" "$env_file"; then
                    check_pass ".env file created from .env.example"
                    check_warn "Please update the placeholder values in $SERVER_DIR/.env"
                else
                    check_fail "Failed to create .env file"
                fi
            else
                check_info "Copy .env.example to .env: cp $SERVER_DIR/.env.example $SERVER_DIR/.env"
            fi
        else
            check_fail "No .env.example found to use as template"
        fi
    fi
}

# =============================================================================
# Check Frontend Requirements
# =============================================================================

check_frontend_requirements() {
    print_section "Frontend Requirements (Next.js)"

    local client_dir="$SCRIPT_DIR/$CLIENT_DIR"

    # Check Node.js
    if command_exists node; then
        local node_version
        node_version=$(node --version | sed 's/v//')
        local node_major
        node_major=$(echo "$node_version" | cut -d. -f1)
        if [[ "$node_major" -ge "$NODE_MIN_VERSION" ]]; then
            check_pass "Node.js installed (version $node_version, >= $NODE_MIN_VERSION required)"
        else
            check_fail "Node.js version $node_version is below minimum required ($NODE_MIN_VERSION+)"
            check_info "Install Node.js $NODE_MIN_VERSION+: https://nodejs.org/"
        fi
    else
        check_fail "Node.js not installed"
        check_info "Install Node.js $NODE_MIN_VERSION+: https://nodejs.org/"
        return
    fi

    # Check npm
    if command_exists npm; then
        local npm_version
        npm_version=$(npm --version)
        check_pass "npm installed (version $npm_version)"
    else
        check_fail "npm not installed"
        check_info "npm should come with Node.js installation"
        return
    fi

    # Check client directory
    if [[ ! -d "$client_dir" ]]; then
        check_warn "Client directory not found: $CLIENT_DIR"
        check_info "Frontend may be in a separate repository"
        return
    fi

    # Check client dependencies
    if [[ -d "$client_dir/node_modules" ]]; then
        check_pass "Frontend dependencies installed"

        # Check Next.js
        if [[ -d "$client_dir/node_modules/next" ]]; then
            check_pass "Next.js dependency installed"
        else
            check_warn "Next.js not found in dependencies"
        fi

        # Check React
        if [[ -d "$client_dir/node_modules/react" ]]; then
            check_pass "React dependency installed"
        else
            check_warn "React not found in dependencies"
        fi
    else
        check_warn "Frontend dependencies not installed"
        if [[ "$SETUP_MODE" == true ]]; then
            check_info "Installing frontend dependencies..."
            if (cd "$client_dir" && npm install &>/dev/null); then
                check_pass "Frontend dependencies installed successfully"
            else
                check_fail "Failed to install frontend dependencies"
            fi
        else
            check_info "Run: cd $CLIENT_DIR && npm install"
        fi
    fi
}

# =============================================================================
# Print Summary
# =============================================================================

print_summary() {
    print_header "Summary"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}   $CHECKS_PASSED"
    echo -e "  ${RED}Failed:${NC}   $CHECKS_FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $CHECKS_WARNED"
    echo ""

    if [[ $CHECKS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}All required checks passed!${NC}"
        if [[ $CHECKS_WARNED -gt 0 ]]; then
            echo -e "${YELLOW}There are some warnings to review.${NC}"
        fi
    else
        echo -e "${RED}Some checks failed. Please address the issues above.${NC}"
        if [[ "$SETUP_MODE" != true ]]; then
            echo -e "${BLUE}Tip: Run with --setup flag to auto-fix some issues${NC}"
        fi
    fi
    echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

# Get script directory and change to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default options
SETUP_MODE=false
PRE_CHECK_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --pre)
            PRE_CHECK_MODE=true
            shift
            ;;
        --setup)
            SETUP_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Print banner
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  mflix Sample Application - Requirements Check               ║${NC}"
echo -e "${BLUE}║  JavaScript/Express Backend                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

if [[ "$PRE_CHECK_MODE" == true ]]; then
    echo -e "${YELLOW}Pre-setup check - verifying runtime requirements only${NC}"
elif [[ "$SETUP_MODE" == true ]]; then
    echo -e "${YELLOW}Running in setup mode - will attempt to fix issues${NC}"
fi

# Run checks based on mode
if [[ "$PRE_CHECK_MODE" == true ]]; then
    check_runtime_requirements
else
    check_backend_requirements
    check_env_configuration
    check_frontend_requirements
fi

# Print summary
print_summary

# Exit with appropriate code
if [[ $CHECKS_FAILED -gt 0 ]]; then
    exit 1
fi
exit 0
