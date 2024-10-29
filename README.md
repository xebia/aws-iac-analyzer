## Well-Architected IaC (Infrastructure as Code) Analyzer

![solutions_diagram](/assets/wa_genai_app_diagram.png)

### Pre-requisites before deploying this CDK stack
* Make sure you [have requested access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html) to **Cohere Embed English v3** and **Claude 3 Sonnet** models in your AWS Account in the region you plan to deploy this stack.
* Install and run [Docker](https://docs.docker.com/engine/install/) in your local machine before running below commands.

If you prefer to use a different model different than "Claude 3 Sonnet", update the config.ini with the correct [model ID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns).
```
[settings]
model_id = anthropic.claude-3-sonnet-20240229-v1:0
```

### Instructions to deploy the solution

**1. Clone this repository**

```
git clone https://github.com/carlos-aws/wa-genai-iac-analyzer.git
cd wa-genai-iac-analyzer
```

**2. Install or update CDK**

```
npm install -g aws-cdk
```

**3. Create and activate a Python virtual environment**

```
python3 -m venv .venv
source .venv/bin/activate
```

**4. Install requirements**

```
pip install -r requirements.txt
```

**5. Set the AWS region were the CDK stack will be deployed**

```
export CDK_DEPLOY_REGION=us-west-2
```

**6. Bootstrap CDK**

```
cdk bootstrap
```

**7. Deploy the solution**

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

