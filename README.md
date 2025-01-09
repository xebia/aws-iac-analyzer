
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

## Prerequisites

The following tools must be installed on your local machine:

* [Node.js](https://nodejs.org/) (v18 or later) and npm
* [Python](https://www.python.org/) (v3.8 or later) and pip
* [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
* [Finch](https://github.com/runfinch/finch) for container management
* [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials

### AWS Bedrock Model Access

You must enable access to the following models in your AWS region:
* **Titan Text Embeddings V2**
* **Claude 3.5 Sonnet v2**

To enable these models, follow the instructions [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).

> **Note:** This application has been primarily tested with "Claude 3.5 Sonnet v2". While other Bedrock models may work, using different models might lead to unexpected results. The default model ID is set to `anthropic.claude-3-5-sonnet-20241022-v2:0`.

## Installation and Deployment

You have two options for deploying this solution:

### Option 1: Using the Deployment Script (Recommended)

1. Clone the Repository
```bash
git clone https://github.com/aws-samples/well-architected-iac-analyzer
cd well-architected-iac-analyzer
```

2. Make the deployment script executable:
```bash
chmod +x deploy-wa-analyzer.sh
```

3. Deploy with default settings (us-west-2 region):
```bash
./deploy-wa-analyzer.sh
```

4. Or deploy to a specific region:
```bash
./deploy-wa-analyzer.sh -r us-east-1
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
git clone https://github.com/aws-samples/well-architected-iac-analyzer
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

Set the AWS region and container runtime:
```bash
export CDK_DEPLOY_REGION=us-west-2
export CDK_DOCKER=finch
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

2. Run the script with default settings (us-west-2 region):
```bash
./destroy-wa-analyzer.sh
```

Or specify a different region:
```bash
./destroy-wa-analyzer.sh -r us-east-1
```

The script will automatically:
- Verify prerequisites
- Set up the necessary environment
- Destroy all resources in the stack

### Option 2 - Using AWS Console

1. Open the CloudFormation console
2. Find and delete the stack named `WA-IaC-Analyzer-{region}-GenAIStack`

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.