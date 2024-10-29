# Well-Architected IaC (Infrastructure as Code) Analyzer

![solutions_diagram](/assets/wa_genai_app_diagram.png)

## Description 

Well-Architected Infrastructure as Code (IaC) Analyzer is a project that demonstrates how generative AI can be used to evaluate infrastructure code for alignment with best practices.

It features a web application built with Streamlit.io, allowing users to upload AWS CloudFormation files for assessment. The application leverages a large language model running on Amazon Bedrock to analyze the code against AWS Well-Architected best practices. These best practices are sourced from AWS Well-Architected whitepapers and synchronized with the Amazon Bedrock knowledge base.

This tool provides users with insights into how well their infrastructure code aligns with or deviates from established AWS best practices, offering suggestions for improving cloud architecture designs.

The project deploys resources running on the following AWS services:
* Application Load Balancer
* Amazon Elastic Container Service (ECS)
* AWS Fargate
* Amazon S3
* AWS Lambda



## Pre-requisites 
Below pre-requesites are to be deployed in your local machine.

* Install [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html).
* Prepare CDK for python [here](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-python.html) 
* Install and run [Docker](https://docs.docker.com/engine/install/).
* Enable access to **Cohere Embed English v3** and **Claude 3 Sonnet** models in your AWS region for your stack [here](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html).


### Optional
If you want to use a different model than "Claude 3 Sonnet", update the config.ini with the correct [model ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns).
```
[settings]
model_id = anthropic.claude-3-sonnet-20240229-v1:0
```

## Instructions to deploy

**1. Clone this repository**

```
git clone https://github.com/carlos-aws/wa-genai-iac-analyzer.git
cd wa-genai-iac-analyzer
```

**2. Create and activate a Python virtual environment**

```
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install requirements**

```
pip install -r requirements.txt
```

**4. Set the AWS region were the CDK stack will be deployed**

```
export CDK_DEPLOY_REGION=us-west-2
```

**5. Bootstrap CDK**

```
cdk bootstrap
```

**6. Deploy the solution**

```
cdk synth
cdk deploy
```

After the deployment is complete, you will see the private ALB DNS name in the output of the `cdk deploy` command. You can also find this information in the outputs section of the CloudFormation stack named `WA-IaC-Analyzer-{region}-GenAIStack` in the AWS Console.

**Important:** The ALB deployed is a private ALB. You will need to ensure you have the necessary network access before attempting to use the application. For example, if you already have a VPC connected to a VPN or Direct Connect connection, you could attach or peer the VPC created as part of this CDK stack into your existing VPN/DirectConnect connected VPC.


### Clean up

Option 1 - Run the following command to remove the CDK stack and all the associated resources created in your AWS account:

```
cdk destroy
```

Option 2 - You can also open the CloudFormation console and directly delete the stack named ``WA-IaC-Analyzer-{region}-GenAIStack``.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

