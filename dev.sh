#!/bin/bash

# Color codes for output
YELLOW='\033[1;33m'

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

# Function to check and start Finch VM if needed
check_and_start_finch_vm() {
    echo "Checking Finch VM status..."
    if ! finch vm status | grep -q "Running"; then
        echo -e "${YELLOW}Finch VM is not running. Starting it now..."
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
        echo -e "${YELLOW}Current version: $(node -v)"
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
        echo -e "${YELLOW}Please configure your AWS credentials using 'aws configure' or set appropriate environment variables"
        return 1
    else
        echo -e "✅ AWS credentials are configured"
        return 0
    fi
}

# Main verification process
echo "Verifying development environment..."

# Initialize error flag
has_error=0

# Perform all checks
check_command "finch" || has_error=1
check_command "node" || has_error=1
check_command "npm" || has_error=1
check_command "aws" || has_error=1
check_and_start_finch_vm || has_error=1
check_node_version || has_error=1
check_npm || has_error=1
check_aws_credentials || has_error=1

# Exit if any checks failed
if [ $has_error -eq 1 ]; then
    echo -e "\n❌ Environment verification failed. Please fix the above issues and try again."
    exit 1
fi

echo -e "\n${GREEN}Environment verification completed successfully!"

# Original dev environment setup continues here
echo "Starting development environment..."

# Start the development environment using finch compose
finch compose -f finch-compose.dev.yaml up --build

# Exit trap to ensure clean shutdown
trap 'finch compose -f finch-compose.dev.yaml down' EXIT