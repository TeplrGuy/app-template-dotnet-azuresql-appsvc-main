#!/bin/bash
# =============================================================================
# Local Load Test Runner for Linux/Mac
# =============================================================================
# Usage: ./run-local.sh <test-id> <profile> [target-url]
# Example: ./run-local.sh student-enrollment smoke http://localhost:5000
# =============================================================================

set -e

TEST_ID="${1:-}"
PROFILE="${2:-smoke}"
TARGET_URL="${3:-http://localhost:5000}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_PATH="$SCRIPT_DIR/manifest.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Usage
if [ -z "$TEST_ID" ]; then
    echo -e "${CYAN}Usage: ./run-local.sh <test-id> <profile> [target-url]${NC}"
    echo ""
    echo "Arguments:"
    echo "  test-id     - The test ID from manifest.yaml (required)"
    echo "  profile     - smoke, load, stress, or chaos (default: smoke)"
    echo "  target-url  - Target application URL (default: http://localhost:5000)"
    echo ""
    echo "Examples:"
    echo "  ./run-local.sh student-enrollment smoke"
    echo "  ./run-local.sh chaos-resilience chaos http://myapp.azurewebsites.net"
    exit 1
fi

# Check JMeter
JMETER_CMD=""
if [ -n "$JMETER_HOME" ] && [ -f "$JMETER_HOME/bin/jmeter" ]; then
    JMETER_CMD="$JMETER_HOME/bin/jmeter"
elif command -v jmeter &> /dev/null; then
    JMETER_CMD="jmeter"
else
    echo -e "${RED}ERROR: JMeter not found. Please install JMeter and set JMETER_HOME${NC}"
    echo -e "${CYAN}Download: https://jmeter.apache.org/download_jmeter.cgi${NC}"
    exit 1
fi

# Check manifest
if [ ! -f "$MANIFEST_PATH" ]; then
    echo -e "${RED}ERROR: manifest.yaml not found at $MANIFEST_PATH${NC}"
    exit 1
fi

# Parse manifest for test config (using grep/sed for portability)
TEST_BLOCK=$(sed -n "/- id: $TEST_ID$/,/^  - id:/p" "$MANIFEST_PATH" | head -n -1)
if [ -z "$TEST_BLOCK" ]; then
    # Try without the end delimiter (last test in list)
    TEST_BLOCK=$(sed -n "/- id: $TEST_ID$/,/^[a-zA-Z]/p" "$MANIFEST_PATH")
fi

if [ -z "$TEST_BLOCK" ]; then
    echo -e "${RED}ERROR: Test '$TEST_ID' not found in manifest${NC}"
    echo -e "${YELLOW}Available tests:${NC}"
    grep "- id:" "$MANIFEST_PATH" | sed 's/- id:/  -/'
    exit 1
fi

# Extract JMX file
JMX_FILE=$(echo "$TEST_BLOCK" | grep "jmx_file:" | sed 's/.*jmx_file:\s*//' | tr -d ' ')
if [ -z "$JMX_FILE" ]; then
    echo -e "${RED}ERROR: jmx_file not defined for test '$TEST_ID'${NC}"
    exit 1
fi

JMX_PATH="$SCRIPT_DIR/$JMX_FILE"
if [ ! -f "$JMX_PATH" ]; then
    echo -e "${RED}ERROR: JMX file not found: $JMX_PATH${NC}"
    exit 1
fi

# Extract profile settings
get_profile_value() {
    local key=$1
    sed -n "/^  $PROFILE:/,/^  [a-z]/p" "$MANIFEST_PATH" | grep "$key:" | sed "s/.*$key:\s*//" | tr -d ' '
}

CONCURRENT_USERS=$(get_profile_value "concurrent_users")
DURATION_SECONDS=$(get_profile_value "duration_seconds")
RAMP_UP_SECONDS=$(get_profile_value "ramp_up_seconds")

if [ -z "$CONCURRENT_USERS" ] || [ -z "$DURATION_SECONDS" ]; then
    echo -e "${RED}ERROR: Profile '$PROFILE' not found or incomplete${NC}"
    exit 1
fi

echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}Running Load Test Locally${NC}"
echo -e "${CYAN}=============================================${NC}"
echo "Test ID:      $TEST_ID"
echo "Profile:      $PROFILE"
echo "JMX File:     $JMX_PATH"
echo "Target URL:   $TARGET_URL"
echo "Users:        $CONCURRENT_USERS"
echo "Duration:     $DURATION_SECONDS seconds"
echo "Ramp-up:      $RAMP_UP_SECONDS seconds"
echo -e "${CYAN}=============================================${NC}"

# Create results directory
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RESULT_FILE="$RESULTS_DIR/$TEST_ID-$PROFILE-$TIMESTAMP.jtl"
REPORT_DIR="$RESULTS_DIR/$TEST_ID-$PROFILE-$TIMESTAMP-report"

# Run JMeter
echo -e "\n${GREEN}Starting JMeter...${NC}"
$JMETER_CMD -n \
    -t "$JMX_PATH" \
    -Jwebapp_url="$TARGET_URL" \
    -Jconcurrent_users="$CONCURRENT_USERS" \
    -Jduration_seconds="$DURATION_SECONDS" \
    -Jramp_up_seconds="$RAMP_UP_SECONDS" \
    -l "$RESULT_FILE" \
    -e -o "$REPORT_DIR"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}=============================================${NC}"
    echo -e "${GREEN}Test completed successfully!${NC}"
    echo -e "${CYAN}Results: $RESULT_FILE${NC}"
    echo -e "${CYAN}Report:  $REPORT_DIR/index.html${NC}"
    echo -e "${GREEN}=============================================${NC}"
else
    echo -e "\n${RED}Test failed${NC}"
    exit 1
fi
