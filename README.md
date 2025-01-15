
# Well-Architected IaC (Infrastructure as Code) Analyzer

![solutions_diagram](/assets/wa_genai_app_diagram.png)

## Description 

Well-Architected Infrastructure as Code (IaC) Analyzer is a project that demonstrates how generative AI can be used to evaluate infrastructure code for alignment with best practices.

It features a modern web application built with React and AWS Cloudscape Design System, allowing users to upload IaC documents (e.g., AWS CloudFormation or Terraform templates) or architecture diagrams for assessment. The application leverages Amazon Bedrock to analyze the infrastructure against AWS Well-Architected best practices. These best practices are sourced from AWS Well-Architected whitepapers and synchronized with the Amazon Bedrock knowledge base.

This tool provides users with insights into how well their infrastructure code aligns with or deviates from established AWS best practices, offering suggestions for improving cloud architecture designs. For architecture diagrams, it can even generate corresponding IaC templates following AWS best practices.

The project deploys resources running on the following AWS services:
* Amazon Virtual Private Cloud (VPC)
* Application Load Balancer
* Amazon Elastic Container Service (ECS)
* AWS Fargate
* Amazon S3
* AWS Lambda
* Amazon Bedrock

![wa_aic_analyzer_screenshot_main](/assets/wa_aic_analyzer_screenshot_main.png)

![wa_aic_analyzer_screenshot_results](/assets/wa_aic_analyzer_screenshot_results.png)

![wa_aic_analyzer_screenshot_details](/assets/wa_aic_analyzer_screenshot_details.png)

![wa_aic_analyzer_screenshot_wa_tool](/assets/wa_aic_analyzer_screenshot_wa_tool.png)

![wa_aic_analyzer_screenshot_template_generation](/assets/wa_aic_analyzer_screenshot_template_generation.png)

## Prerequisites

The following tools must be installed on your local machine:

* [Node.js](https://nodejs.org/en/download) (v18 or later) and npm
* [Python](https://www.python.org/downloads/) (v3.11 or later) and pip
* [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
* Either one of these container tools:
  * [Finch](https://github.com/runfinch/finch?tab=readme-ov-file#installing-finch) (default)
  * [Docker](https://docs.docker.com/get-started/get-docker/)
* [AWS CLI](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-install.html) configured with [appropriate credentials](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html)

### AWS Bedrock Model Access

You must enable access to the following models in your AWS region:
* **Titan Text Embeddings V2**
* **Claude 3.5 Sonnet v2**

To enable these models, follow the instructions [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).

## Installation and Deployment

> **Note:** If you would like to change the default Load Balancer scheme or AI model, check the [Configuration Options section](#configuration-options) first before deploying.

You have two options for deploying this solution:

### Option 1: Using the Deployment Script (Recommended)

1. Clone the Repository
```bash
git clone https://github.com/aws-samples/well-architected-iac-analyzer.git
cd well-architected-iac-analyzer
```

2. Make the deployment script executable:
```bash
chmod +x deploy-wa-analyzer.sh
```

3. Deploy with default settings (us-west-2 region and Finch as container tool):
```bash
./deploy-wa-analyzer.sh
```

4. Or deploy with specific options:
```bash
# Deploy to a specific region
./deploy-wa-analyzer.sh -r us-east-1

# Deploy using Docker instead of Finch
./deploy-wa-analyzer.sh -c docker

# Deploy to a specific region using Docker
./deploy-wa-analyzer.sh -r us-east-1 -c docker
```

The script will automatically:
- Check for prerequisites
- Set up the Python virtual environment
- Install all dependencies
- Deploy the CDK stack
- Provide post-deployment information

### Option 2: Manual Deployment

If you prefer to deploy step by step, follow these instructions:

#### 1. Clone the Repository
```bash
git clone https://github.com/aws-samples/well-architected-iac-analyzer.git
cd well-architected-iac-analyzer
```

#### 2. Set Up Python Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Verify you're in the virtual environment
# You should see (.venv) at the beginning of your prompt
```

#### 3. Install Dependencies

Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

Install CDK dependencies:
```bash
npm install
```

Install Frontend dependencies:
```bash
cd ecs_fargate_app/frontend
npm install
cd ../..
```

Install Backend dependencies:
```bash
cd ecs_fargate_app/backend
npm install
cd ../..
```

#### 4. Deploy the Stack

Set the AWS region and ignore ECR credentials storage during CDK deployment:
```bash
export CDK_DEPLOY_REGION=us-west-2
export AWS_ECR_IGNORE_CREDS_STORAGE=true
```

Set the container runtime:
```bash
export CDK_DOCKER=finch  # For Finch (default)

# OR

export CDK_DOCKER=docker # For Docker
```

Bootstrap CDK (if not already done):
```bash
cdk bootstrap
```

Deploy the stack:
```bash
cdk deploy
```

## Configuration Options

### Model Selection

If you want to use a different model than "Claude 3.5 Sonnet v2", update the config.ini with the correct [model ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns):
```ini
[settings]
model_id = anthropic.claude-3-5-sonnet-20241022-v2:0
```

> **Note:** This application has been primarily tested with "Claude 3.5 Sonnet v2". While other Bedrock models may work, using different models might lead to unexpected results. The default model ID is set to `anthropic.claude-3-5-sonnet-20241022-v2:0`.

## IMPORTANT SECURITY NOTE

> By default, this project will deploy the Load Balancer scheme as [**internal**](https://docs.aws.amazon.com./elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html#load-balancer-scheme) **(Private load balancer)**. To access the application, you will need to be in the private network connected to the deployed VPC, either via:
> * [VPC peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
> * VPN
> * AWS Direct Connect
> * Other network connectivity solutions
>
> If you need to change the load balancer scheme to [**internet-facing**](https://docs.aws.amazon.com./elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html#load-balancer-scheme), you can modify the `public_load_balancer` parameter in the config.ini file:
> ```ini
> [settings]
> public_load_balancer = True
> ```
> ⚠️ **Security Warning**: This project is prepared as a **demo** with **no authentication mechanism**. If you change the load balancer to be **internet-facing**, the application and all its functionalities will be accessible directly through the internet without authentication. Proceed with caution and understand the security implications.

## Accessing the Application

After successful deployment, you can find the Application Load Balancer (ALB) DNS name in:
1. The outputs of the `cdk deploy` command
2. The outputs section of the CloudFormation stack named `WA-IaC-Analyzer-{region}-GenAIStack` in the AWS Console

## Features

- Upload and analyze Infrastructure as Code templates:
  - CloudFormation (YAML/JSON)
  - Terraform (.tf)
- Upload and analyze architecture diagrams:
  - PNG format
  - JPEG/JPG format
- Generate IaC templates from architecture diagrams
- Real-time analysis against Well-Architected best practices
- Integration with AWS Well-Architected Tool
- Export analysis results and recommendations

## Clean up

You have two options to remove all resources created by this solution:

### Option 1 - Using the Destroy Script (Recommended)

1. Make the destroy script executable:
```bash
chmod +x destroy-wa-analyzer.sh
```

2. Run the script:
```bash
# With default settings (us-west-2 region and Finch as container tool)
./destroy-wa-analyzer.sh

# Specify a different region
./destroy-wa-analyzer.sh -r us-east-1

# Use Docker instead of Finch
./destroy-wa-analyzer.sh -c docker

# Specify both region and container tool
./destroy-wa-analyzer.sh -r us-east-1 -c docker
```

The script will automatically:
- Verify prerequisites
- Set up the necessary environment
- Destroy all resources in the stack

### Option 2 - Using AWS Console

1. Open the CloudFormation console
2. Find and delete the stack named `WA-IaC-Analyzer-{region}-GenAIStack`

## Local Development

For development purposes, you can run the application locally using either Finch (default) or Docker containers. This allows you to make changes to the code and see them reflected immediately without having to deploy to AWS.

### Prerequisites for Local Development

In addition to the main prerequisites, ensure you have:
* Either Finch or Docker installed and running
* AWS credentials configured with access to required services
* Access to Amazon Bedrock service and the required models (as described in the main Prerequisites section)

### Setting up Required AWS Resources

> **Note for Existing Stack Users**: If you have already deployed this CDK stack in your AWS account, you can skip the manual resource creation steps below. Instead:
> 1. Go to the CloudFormation console and find your stack (it starts with "WA-IaC-Analyzer-")
> 2. In the "Outputs" tab of the CDK CloudFormation stack, find:
>    - `KnowledgeBaseID`: Use this value for KNOWLEDGE_BASE_ID in your .env file (for "Setting up Local Development Environment" section below)
>    - `WellArchitectedDocsS3Bucket`: Use this value for WA_DOCS_S3_BUCKET in your .env file (for "Setting up Local Development Environment" section below)
> 
> If you haven't deployed the stack yet, follow the steps below to create the required resources manually:

1. Create an S3 bucket:
   ```bash
   aws s3 mb s3://your-bucket-name --region your-aws-region
   ```

2. Upload Well-Architected documents:
   ```bash
   aws s3 cp ecs_fargate_app/well_architected_docs/ s3://your-bucket-name/ --recursive
   ```

3. Create a Bedrock Knowledge Base:
   - Go to the Amazon Bedrock console
   - Navigate to Knowledge bases
   - Click "Create knowledge base with vector store"
   - Enter a name for your knowledge base
   - Select "Amazon S3" as the data source
   - Click "Next"
   - Add your S3 bucket as a data source:
     - Choose the bucket you created
     - Leave all other settings as default
     - Click "Next"
   - Select "Titan Text Embeddings v2" as the embedding model and use the default Vector database settings
   - Click "Next" and Complete the knowledge base creation
   - Note the Knowledge Base ID from the details page

### Setting up Local Development Environment

1. Create a `.env` file in the root directory with the following variables:
```ini
AWS_REGION=your-aws-region-key
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
WA_DOCS_S3_BUCKET=your-s3-bucket
KNOWLEDGE_BASE_ID=your-kb-id
MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

2. Make the development script executable:
```bash
chmod +x dev.sh
```

3. Start the development environment:
```bash
# Start development environment using Finch
./dev.sh -c finch

# OR, using Docker
./dev.sh -c docker
```

This will:
- Build and start the frontend container (available at http://localhost:8080)
- Build and start the backend container (available at http://localhost:3000)
- Enable hot reloading for both frontend and backend changes
- Mount source code directories as volumes for immediate updates

### Development Commands

```bash
# Start development environment using Finch
./dev.sh -c finch

# OR, using Docker
./dev.sh -c docker

# Stop development environment
npm run dev:down

# Clean up development environment (removes volumes)
npm run dev:clean
```

### Switching Between Development and Production

- Local development uses `finch-compose.dev.yaml` for container configuration
- Production deployment continues to use CDK as described in the Installation and Deployment section

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
