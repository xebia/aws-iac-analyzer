export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    signOutUrl: process.env.AUTH_SIGN_OUT_URL || '',
  },
  aws: {
    region: process.env.AWS_REGION || process.env.CDK_DEPLOY_REGION,
    s3: {
      waDocsBucket: process.env.WA_DOCS_S3_BUCKET,
    },
    bedrock: {
      knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      modelId: process.env.MODEL_ID,
    },
  },
});