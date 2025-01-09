#!/bin/bash

# Instructions for using the script:

# 1. Make the script executable:
# ```bash
# chmod +x destroy-wa-analyzer.sh
# ```

# 2. Basic usage with defaults (us-west-2 region):
# ```bash
# ./destroy-wa-analyzer.sh
# ```

# 3. Destroy stack in a specific region:
# ```bash
# ./destroy-wa-analyzer.sh -r us-east-1
# ```

# 4. Show help:
# ```bash
# ./destroy-wa-analyzer.sh -h
# ```

# Exit on error
set -e

# Default values
DEFAULT_REGION="us-west-2"

# Print script usage
print_usage() {
    echo "Usage: ./destroy-wa-analyzer.sh [-r region]"
    echo ""
    echo "Options:"
    echo "  -r    AWS Region (default: us-west-2)"
    echo "  -h    Show this help message"
    echo ""
    echo "Example:"
    echo "  ./destroy-wa-analyzer.sh -r us-east-1"
}

# Parse command line arguments
while getopts "r:h" flag; do
    case "${flag}" in
        r) DEFAULT_REGION=${OPTARG};;
        h) print_usage
           exit 0;;
        *) print_usage
           exit 1;;
    esac
done

# Function to check Finch VM status
check_finch_vm() {
    echo "Checking Finch setup..."
    local max_attempts=30  # Maximum number of attempts (30 * 2 seconds = 60 seconds timeout)
    local attempt=1

    if ! finch vm status &> /dev/null; then
        echo "Initializing Finch VM..."
        finch vm init
        echo "Starting Finch VM..."
        finch vm start
    elif ! finch vm status | grep -q "Running"; then
        echo "Starting Finch VM..."
        finch vm start
    fi

    echo "Waiting for Finch VM to be ready..."
    while ! finch vm status | grep -q "Running"; do
        if [ $attempt -ge $max_attempts ]; then
            echo "❌ Timeout waiting for Finch VM to start"
            exit 1
        fi
        echo "Still waiting for Finch VM to be ready... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    echo "✅ Finch VM is running"
}

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check required commands
    local required_commands=("node" "npm" "aws" "cdk" "python3" "pip3" "finch")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            missing_commands+=($cmd)
            echo "❌ $cmd is required but not installed"
        else
            echo "✅ $cmd is installed"
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS credentials not configured"
        exit 1
    else
        echo "✅ AWS credentials configured"
    fi
    
    # Check Finch VM
    check_finch_vm
    
    # Exit if any commands are missing
    if [ ${#missing_commands[@]} -ne 0 ]; then
        echo -e "\n❌ Please install missing prerequisites: ${missing_commands[*]}"
        exit 1
    fi
    
    echo "✅ All prerequisites met"
}

# Function to setup Python environment
setup_python_env() {
    echo "🐍 Setting up Python environment..."
    
    # Create and activate Python virtual environment
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    
    # Activate virtual environment
    echo "Activating virtual environment..."
    source .venv/bin/activate
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    pip3 install --upgrade pip
    pip3 install -r requirements.txt
    
    echo "✅ Python environment setup completed"
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    # Deactivate virtual environment if it's active
    if [ -n "$VIRTUAL_ENV" ]; then
        deactivate
        echo "✅ Virtual environment deactivated"
    fi
}

# Function to destroy the stack
destroy_stack() {
    echo "🗑️ Destroying Well-Architected Analyzer stack..."
    
    # Set AWS region
    export CDK_DEPLOY_REGION=$DEFAULT_REGION
    echo "Using AWS Region: $DEFAULT_REGION"

    # Set finch for building the CDK container images
    export CDK_DOCKER=finch
    
    # Destroy stack
    echo "⚠️ WARNING: This will destroy all resources in the stack!"
    echo "Proceeding with stack destruction in 5 seconds..."
    sleep 5
    
    echo "Running 'cdk destroy --force' command..."
    cdk destroy --force
}

# Main execution
main() {
    echo "🗑️ Starting Well-Architected Analyzer stack destruction..."
    echo "Region: $DEFAULT_REGION"
    
    # Get AWS account ID
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    
    # Set up trap to ensure cleanup runs on exit
    trap cleanup EXIT
    
    # Run destruction steps
    check_prerequisites
    setup_python_env
    destroy_stack
    
    echo -e "\n✅ Stack destruction completed successfully!"
}

# Run main function
main