"""CDK stack for hosting react app in ECS and Fargate"""

import configparser
import platform
import uuid

import aws_cdk as cdk
import aws_cdk.aws_servicediscovery as servicediscovery
from aws_cdk import Duration, RemovalPolicy, Stack
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_ecs as ecs
from aws_cdk import aws_ecs_patterns as ecs_patterns
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3deploy
from aws_cdk import custom_resources as cr
from aws_cdk.aws_ecr_assets import DockerImageAsset, Platform
from cdklabs.generative_ai_cdk_constructs import bedrock
from constructs import Construct


class WAGenAIStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwarg) -> None:
        super().__init__(scope, construct_id, **kwarg)

        # Read config.ini
        config = configparser.ConfigParser()
        config.read("config.ini")
        model_id = config["settings"]["model_id"]
        if config["settings"]["public_load_balancer"] == "False":
            public_lb = False
        else:
            public_lb = True

        random_id = str(uuid.uuid4())[:8]  # First 8 characters of a UUID

        platform_mapping = {
            "x86_64": {
                "fargate_architecture": ecs.CpuArchitecture.X86_64,
                "build_architecture": Platform.LINUX_AMD64,
                "build_architecture_argument": "amd64",
            },
            "arm64": {
                "fargate_architecture": ecs.CpuArchitecture.ARM64,
                "build_architecture": Platform.LINUX_ARM64,
                "build_architecture_argument": "arm64",
            },
            "aarch64": {
                "fargate_architecture": ecs.CpuArchitecture.ARM64,
                "build_architecture": Platform.LINUX_ARM64,
                "build_architecture_argument": "arm64",
            },
        }
        # Get architecture from platform (depending the machine that runs CDK)
        architecture = platform_mapping[platform.machine()]

        # Creates Bedrock KB using the generative_ai_cdk_constructs
        kb = bedrock.KnowledgeBase(
            self,
            "WAFR-KnowledgeBase",
            embeddings_model=bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V2_1024,
            instruction="Use this knowledge base to answer questions about AWS Well Architected Framework Review (WAFR).",
            description="This knowledge base contains AWS Well Architected Framework Review (WAFR) reference documents",
        )

        KB_ID = kb.knowledge_base_id

        # Create S3 bucket where well architected reference docs are stored
        wafrReferenceDocsBucket = s3.Bucket(
            self,
            "wafr-accelerator-kb-docs",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
        )

        # Uploading WAFR docs to the corresponding S3 bucket [wafrReferenceDocsBucket]
        wafrReferenceDeploy = s3deploy.BucketDeployment(
            self,
            "uploadwellarchitecteddocs",
            sources=[s3deploy.Source.asset("ecs_fargate_app/well_architected_docs")],
            destination_bucket=wafrReferenceDocsBucket,
        )

        WA_DOCS_BUCKET_NAME = wafrReferenceDocsBucket.bucket_name

        # Adds the created S3 bucket [docBucket] as a Data Source for Bedrock KB
        kbDataSource = bedrock.S3DataSource(
            self,
            "DataSource",
            bucket=wafrReferenceDocsBucket,
            knowledge_base=kb,
            data_source_name="wafr-reference-docs",
            chunking_strategy=bedrock.ChunkingStrategy.FIXED_SIZE,
        )

        # Data Ingestion Params
        dataSourceIngestionParams = {
            "dataSourceId": kbDataSource.data_source_id,
            "knowledgeBaseId": KB_ID,
        }

        # Define a custom resource to make an AwsSdk startIngestionJob call
        ingestion_job_cr = cr.AwsCustomResource(
            self,
            "IngestionCustomResource",
            on_create=cr.AwsSdkCall(
                service="bedrock-agent",
                action="startIngestionJob",
                parameters=dataSourceIngestionParams,
                physical_resource_id=cr.PhysicalResourceId.of("Parameter.ARN"),
            ),
            policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
                resources=cr.AwsCustomResourcePolicy.ANY_RESOURCE
            ),
        )

        # Params for the test Well-Architected Workload
        test_workload_region = Stack.of(self).region
        waToolWorkloadParams = {
            "WorkloadName": f"DO-NOT-DELETE_WAIaCAnalyzerApp_{test_workload_region}_{random_id}",
            "Description": f"DO-NOT-DELETE_WAIaCAnalyzerApp_{test_workload_region} TestWorkload for WA IoC Analyzer App",
            "ReviewOwner": "WA IoC Analyzer App",
            "Environment": "PREPRODUCTION",
            "AwsRegions": [test_workload_region],
            "Lenses": ["wellarchitected"],
            "ClientRequestToken": random_id,
        }
        # Create a test Well-Architected Workload
        workload_cr = cr.AwsCustomResource(
            self,
            "TestWorkload",
            on_create=cr.AwsSdkCall(
                service="wellarchitected",
                action="createWorkload",
                parameters=waToolWorkloadParams,
                physical_resource_id=cr.PhysicalResourceId.from_response("WorkloadId"),
                output_paths=["WorkloadId"],
            ),
            on_update=cr.AwsSdkCall(
                service="wellarchitected",
                action="listLensReviews",
                parameters={
                    "WorkloadId": cr.PhysicalResourceIdReference(),
                },
                physical_resource_id=cr.PhysicalResourceId.from_response("WorkloadId"),
                output_paths=["WorkloadId"],
            ),
            on_delete=cr.AwsSdkCall(
                service="wellarchitected",
                action="deleteWorkload",
                parameters={
                    "WorkloadId": cr.PhysicalResourceIdReference(),
                    "ClientRequestToken": random_id,
                },
            ),
            policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
                resources=cr.AwsCustomResourcePolicy.ANY_RESOURCE
            ),
        )

        # Lambda function to refresh and sync Knowledge Base with data source
        kb_lambda_synchronizer = lambda_.Function(
            self,
            "KbLambdaSynchronizer",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="kb_synchronizer.handler",
            code=lambda_.Code.from_asset(
                "ecs_fargate_app/lambda_kb_synchronizer",
                bundling=cdk.BundlingOptions(
                    image=lambda_.Runtime.PYTHON_3_12.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "pip install --no-cache -r requirements.txt -t /asset-output && cp -au . /asset-output",
                    ],
                ),
            ),
            environment={
                "KNOWLEDGE_BASE_ID": KB_ID,
                "DATA_SOURCE_ID": kbDataSource.data_source_id,
                "WA_DOCS_BUCKET_NAME": wafrReferenceDocsBucket.bucket_name,
                "WORKLOAD_ID": workload_cr.get_response_field("WorkloadId"),
            },
            timeout=Duration.minutes(15),
        )

        # Grant permissions to the KB synchronizer Lambda
        kb_lambda_synchronizer.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:StartIngestionJob"],
                resources=[
                    f"arn:aws:bedrock:{self.region}:{self.account}:knowledge-base/{KB_ID}"
                ],
            )
        )
        kb_lambda_synchronizer.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "wellarchitected:GetLensReview",
                    "wellarchitected:ListAnswers",
                    "wellarchitected:UpgradeLensReview",
                ],
                resources=["*"],
            )
        )
        wafrReferenceDocsBucket.grant_put(kb_lambda_synchronizer)

        # Create EventBridge rule to trigger KbLambdaSynchronizer weekly on Mondays
        events.Rule(
            self,
            "WeeklyIngestionRule",
            schedule=events.Schedule.cron(
                minute="0", hour="0", month="*", week_day="2", year="*"
            ),
            targets=[targets.LambdaFunction(kb_lambda_synchronizer)],
        )

        frontend_image = DockerImageAsset(
            self,
            "FrontendImage",
            directory="ecs_fargate_app",
            file="finch/frontend.Dockerfile",
            platform=architecture["build_architecture"],
            build_args={
                "BUILDKIT_INLINE_CACHE": "1",
                "PLATFORM": architecture["build_architecture_argument"],
            },
        )

        backend_image = DockerImageAsset(
            self,
            "BackendImage",
            directory="ecs_fargate_app",
            file="finch/backend.Dockerfile",
            platform=architecture["build_architecture"],
            build_args={
                "BUILDKIT_INLINE_CACHE": "1",
                "PLATFORM": architecture["build_architecture_argument"],
            },
        )

        # create app execute role
        app_execute_role = iam.Role(
            self,
            "AppExecuteRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=["*"],
            )
        )

        # Add policy statements to the IAM role
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "wellarchitected:GetLensReview",
                    "wellarchitected:ListAnswers",
                    "wellarchitected:GetWorkload",
                    "wellarchitected:UpdateAnswer",
                    "wellarchitected:CreateMilestone",
                    "wellarchitected:GetLensReviewReport",
                ],
                resources=["*"],
            )
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "wellarchitected:CreateWorkload",
                    "wellarchitected:TagResource",
                ],
                resources=["*"],
                conditions={
                    "StringLike": {
                        "aws:RequestTag/WorkloadName": [
                            "DO_NOT_DELETE_temp_IaCAnalyzer_*",
                            "IaCAnalyzer_*",
                        ]
                    }
                },
            )
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "wellarchitected:DeleteWorkload",
                ],
                resources=["*"],
                conditions={
                    "StringLike": {
                        "aws:ResourceTag/WorkloadName": [
                            "DO_NOT_DELETE_temp_IaCAnalyzer_*",
                            "IaCAnalyzer_*",
                        ]
                    }
                },
            )
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(actions=["bedrock:InvokeModel"], resources=["*"])
        )
        app_execute_role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject", "s3:ListBucket"],
                resources=[
                    f"arn:aws:s3:::{WA_DOCS_BUCKET_NAME}",
                    f"arn:aws:s3:::{WA_DOCS_BUCKET_NAME}/*",
                ],
            )
        )
        app_execute_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonBedrockFullAccess")
        )

        # Create VPC to host the ECS cluster
        vpc = ec2.Vpc(
            self,
            "ECSVpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public", subnet_type=ec2.SubnetType.PUBLIC
                ),
                ec2.SubnetConfiguration(
                    name="private", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
            ],
        )

        # Capture the public subnets
        public_subnets = vpc.select_subnets(subnet_type=ec2.SubnetType.PUBLIC)

        # Create ECS Cluster
        ecs_cluster = ecs.Cluster(self, "AppCluster", vpc=vpc, container_insights=True)

        # Add ECS Service Discovery namespace
        namespace = servicediscovery.PrivateDnsNamespace(
            self, "ServiceDiscovery", name="internal", vpc=vpc
        )

        # Create security groups for frontend and backend
        frontend_security_group = ec2.SecurityGroup(
            self,
            "FrontendSecurityGroup",
            vpc=vpc,
            description="Security group for frontend service",
        )

        backend_security_group = ec2.SecurityGroup(
            self,
            "BackendSecurityGroup",
            vpc=vpc,
            description="Security group for backend service",
        )

        # Create frontend service with ALB
        frontend_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "FrontendService",
            cluster=ecs_cluster,
            runtime_platform=ecs.RuntimePlatform(
                operating_system_family=ecs.OperatingSystemFamily.LINUX,
                cpu_architecture=architecture["fargate_architecture"],
            ),
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_docker_image_asset(frontend_image),
                container_port=8080,
                environment={
                    # Use service discovery DNS name
                    "VITE_API_URL": f"http://backend.internal:3000"
                },
            ),
            public_load_balancer=public_lb,
            security_groups=[frontend_security_group],
        )

        # Set ALB idle timeout to 15 minutes
        frontend_service.load_balancer.set_attribute(
            "idle_timeout.timeout_seconds", "3600"
        )

        # Allow ALB to access frontend on port 8080
        frontend_security_group.add_ingress_rule(
            peer=frontend_service.load_balancer.connections.security_groups[
                0
            ],  # ALB security group
            connection=ec2.Port.tcp(8080),
            description="Allow ALB to access frontend",
        )

        # Allow frontend to access backend on port 3000
        backend_security_group.add_ingress_rule(
            peer=frontend_security_group,
            connection=ec2.Port.tcp(3000),
            description="Allow frontend to access backend",
        )

        # Get the ALB DNS name after frontend service is created
        alb_dns = frontend_service.load_balancer.load_balancer_dns_name

        # Configure health check for ALB
        frontend_service.target_group.configure_health_check(path="/healthz")

        # Create backend service with service discovery
        backend_task_definition = ecs.FargateTaskDefinition(
            self,
            "BackendTaskDef",
            runtime_platform=ecs.RuntimePlatform(
                operating_system_family=ecs.OperatingSystemFamily.LINUX,
                cpu_architecture=architecture["fargate_architecture"],
            ),
            task_role=app_execute_role,
        )

        backend_container = backend_task_definition.add_container(
            "BackendContainer",
            image=ecs.ContainerImage.from_docker_image_asset(backend_image),
            environment={
                "WA_DOCS_S3_BUCKET": WA_DOCS_BUCKET_NAME,
                "KNOWLEDGE_BASE_ID": KB_ID,
                "MODEL_ID": model_id,
                "AWS_REGION": Stack.of(self).region,
                "FRONTEND_URL": f"http://{alb_dns}",
            },
            logging=ecs.LogDriver.aws_logs(stream_prefix="backend"),
        )

        backend_container.add_port_mappings(ecs.PortMapping(container_port=3000))

        # Create the backend service
        backend_service = ecs.FargateService(
            self,
            "BackendService",
            cluster=ecs_cluster,
            task_definition=backend_task_definition,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[backend_security_group],
        )

        # Add service discovery
        backend_service.enable_cloud_map(cloud_map_namespace=namespace, name="backend")

        # Output the frontend ALB DNS name
        cdk.CfnOutput(
            self,
            "FrontendURL",
            value=frontend_service.load_balancer.load_balancer_dns_name,
            description="Frontend application URL",
        )

        # Output the ID of the Bedrock knowledge base
        cdk.CfnOutput(
            self,
            "KnowledgeBaseID",
            value=KB_ID,
            description="ID of the Bedrock knowledge base",
        )

        # Output S3 bucket (Source of Bedrock knowledge base) with well-architected documents.
        cdk.CfnOutput(
            self,
            "WellArchitectedDocsS3Bucket",
            value=wafrReferenceDocsBucket.bucket_name,
            description="S3 bucket (Source of Bedrock knowledge base) with well-architected documents.",
        )

        # Output the VPC ID
        cdk.CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="ID of the VPC where the private ALB is created",
        )

        # Output the ID of the first public subnet
        cdk.CfnOutput(
            self,
            "PublicSubnetId",
            value=public_subnets.subnet_ids[0],
            description="ID of the public subnet created in the VPC",
        )

        # Node dependencies
        kbDataSource.node.add_dependency(wafrReferenceDocsBucket)
        ingestion_job_cr.node.add_dependency(kb)
        kb_lambda_synchronizer.node.add_dependency(kb)
        kb_lambda_synchronizer.node.add_dependency(kbDataSource)
        kb_lambda_synchronizer.node.add_dependency(wafrReferenceDocsBucket)
        kb_lambda_synchronizer.node.add_dependency(workload_cr)
