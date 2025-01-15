#!/bin/bash

# Color codes for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Default container tool
CONTAINER_TOOL="finch"

# Print script usage
print_usage() {
    echo "Usage: ./dev.sh [-c container_tool]"
    echo ""
    echo "Options:"
    echo "  -c    Container tool (finch or docker, default: finch)"
    echo "  -h    Show this help message"
    echo ""
    echo "Example:"
    echo "  ./dev.sh -c docker"
}

# Parse command line arguments
while getopts "c:h" flag; do
    case "${flag}" in
        c) CONTAINER_TOOL=${OPTARG};;
        h) print_usage
           exit 0;;
        *) print_usage
           exit 1;;
    esac
done

# Validate container tool
if [[ "$CONTAINER_TOOL" != "finch" && "$CONTAINER_TOOL" != "docker" ]]; then
    echo "❌ Invalid container tool. Must be either 'finch' or 'docker'"
    print_usage
    exit 1
fi

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "❌ Error: $1 is not installed"
        return 1
    else
        echo -e "✅ $1 is installed"
        return 0
    fi
}

# Function to check Docker daemon
check_docker_daemon() {
    echo "Checking Docker setup..."
    
    # First check if Docker client exists
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Please install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Please install Docker using your distribution's package manager"
            echo "For Ubuntu/Debian: sudo apt-get install docker.io"
            echo "For RHEL/CentOS: sudo yum install docker"
        else
            echo "Please install Docker and try again"
        fi
        return 1
    fi

    # Try to get Docker server version and capture the output and exit status
    local server_version
    local exit_status
    
    server_version=$(docker info --format '{{.ServerVersion}}' 2>&1)
    exit_status=$?

    # Check if the command was successful and if the output doesn't contain error messages
    if [ $exit_status -ne 0 ] || [[ $server_version == *"Cannot connect"* ]] || [[ $server_version == *"error"* ]] || [[ $server_version == *"command not found"* ]]; then
        echo "❌ Docker daemon is not running"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Please start Docker Desktop for Mac and try again"
            echo "You can start it from the Applications folder or menu bar icon"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Please start Docker daemon (dockerd) and try again"
            echo "You can start it with: sudo systemctl start docker"
        else
            echo "Please start Docker daemon and try again"
        fi
        echo "Error details: $server_version"
        return 1
    fi
    
    echo "✅ Docker daemon is running (Server Version: $server_version)"
    return 0
}

# Function to check and start Finch VM if needed
check_and_start_finch_vm() {
    echo "Checking Finch VM status..."
    if ! finch vm status | grep -q "Running"; then
        echo -e "${YELLOW}Finch VM is not running. Starting it now...${NC}"
        if ! finch vm start; then
            echo -e "❌ Error: Failed to start Finch VM"
            return 1
        fi
        
        # Wait for VM to be fully ready
        echo "Waiting for Finch VM to be ready..."
        sleep 5
        
        if ! finch vm status | grep -q "Running"; then
            echo -e "❌ Error: Finch VM failed to start properly"
            return 1
        fi
    fi
    echo -e "✅ Finch VM is running"
    return 0
}

# Function to check Node.js version
check_node_version() {
    local required_version="18"
    local current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    
    if [ "$current_version" -lt "$required_version" ]; then
        echo -e "❌ Error: Node.js version must be v${required_version} or higher"
        echo -e "${YELLOW}Current version: $(node -v)${NC}"
        return 1
    else
        echo -e "✅ Node.js version $(node -v) is compatible"
        return 0
    fi
}

# Function to check npm installation
check_npm() {
    if ! npm -v &> /dev/null; then
        echo -e "❌ Error: npm is not installed"
        return 1
    else
        echo -e "✅ npm is installed ($(npm -v))"
        return 0
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "❌ Error: AWS credentials not configured"
        echo -e "${YELLOW}Please configure your AWS credentials using 'aws configure' or set appropriate environment variables${NC}"
        return 1
    else
        echo -e "✅ AWS credentials are configured"
        return 0
    fi
}

# Main verification process
echo "Verifying development environment..."
echo "Using container tool: $CONTAINER_TOOL"

# Initialize error flag
has_error=0

# Perform all checks
check_command "node" || has_error=1
check_command "npm" || has_error=1
check_command "aws" || has_error=1
check_command "$CONTAINER_TOOL" || has_error=1

if [ "$CONTAINER_TOOL" = "docker" ]; then
    check_docker_daemon || has_error=1
else
    check_and_start_finch_vm || has_error=1
fi

check_node_version || has_error=1
check_npm || has_error=1
check_aws_credentials || has_error=1

# Exit if any checks failed
if [ $has_error -eq 1 ]; then
    echo -e "\n❌ Environment verification failed. Please fix the above issues and try again."
    exit 1
fi

echo -e "\n✅ Environment verification completed successfully!${NC}"

# Start the development environment
echo "Starting development environment..."

# Use the appropriate compose command based on the container tool
if [ "$CONTAINER_TOOL" = "docker" ]; then
    docker compose -f finch-compose.dev.yaml up --build
    # Set up trap for clean shutdown
    trap 'docker compose -f finch-compose.dev.yaml down' EXIT
else
    finch compose -f finch-compose.dev.yaml up --build
    # Set up trap for clean shutdown
    trap 'finch compose -f finch-compose.dev.yaml down' EXIT
fi