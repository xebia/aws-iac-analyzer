export interface WellArchitectedPillar {
  id: string;
  name: string;
  selected: boolean;
}

export interface BestPractice {
  id: string;
  name: string;
  pillarId: string;
  questionId: string;
  relevant: boolean;
  applied: boolean;
  reasonApplied?: string;
  reasonNotApplied?: string;
  recommendations?: string;
  extendedRecommendations?: string;
}

export interface AnalysisResult {
  pillar: string;
  question: string;
  questionId: string;
  bestPractices: BestPractice[];
}

export interface WorkloadReview {
  workloadId: string;
  lensAlias: string;
  results: AnalysisResult[];
}

export interface RiskSummary {
  pillarName: string;
  totalQuestions: number;
  answeredQuestions: number;
  highRisks: number;
  mediumRisks: number;
}

export interface UploadedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

export interface WorkItemUpdate {
  analysisStatus?: WorkItemStatus;
  analysisProgress?: number;
  analysisError?: string;
  analysisPartialResults?: boolean;
  iacGenerationStatus?: WorkItemStatus;
  iacGenerationProgress?: number;
  iacGenerationError?: string;
  iacGeneratedFileType?: string;
  iacPartialResults?: boolean;
  lastModified?: string;
  workloadId?: string;
  uploadMode?: FileUploadMode;
  exceedsTokenLimit?: boolean;
  tokenCount?: number;
  
  // Supporting document properties
  supportingDocumentId?: string;
  supportingDocumentAdded?: boolean;
  supportingDocumentDescription?: string;
  supportingDocumentName?: string;
  supportingDocumentType?: string;
}

export interface UploadedFiles {
  // Single file case
  singleFile?: UploadedFile;
  // Multi-file case
  multipleFiles?: UploadedFile[];
  // ZIP file case
  zipFile?: UploadedFile;
  // Upload mode
  mode: FileUploadMode;
  // If tokens exceed limit (for ZIP and multiple files)
  exceedsTokenLimit?: boolean;
  // Estimated token count (for ZIP and multiple files)
  tokenCount?: number;

  // Supporting document
  supportingDocument?: UploadedFile;
  supportingDocumentId?: string;
  supportingDocumentDescription?: string;
}

// Upload modes
export enum FileUploadMode {
  SINGLE_FILE = 'single_file',
  MULTIPLE_FILES = 'multiple_files',
  ZIP_FILE = 'zip_file'
}

export enum FileType {
  IAC = 'iac',
  IMAGE = 'image'
}

export interface UpdatedDocument {
  content: string;
  name: string;
  templateType?: IaCTemplateType;
}

export interface WorkloadCreationResult {
  workloadId: string;
  isTemp: boolean;
}

export interface RiskSummaryProps {
  summary: RiskSummary[] | null;
  onUpdate: () => void;
  onGenerateReport: () => void;
  onDeleteWorkload: () => void;
  onRefresh: () => void;
  isUpdating: boolean;
  isRefreshing: boolean;
  isGeneratingReport: boolean;
  isDeleting: boolean;
  canDeleteWorkload: boolean;
  hasProvidedWorkloadId: boolean;
}

export interface SelectedAnalysisItem {
  pillar: string;
  question: string;
  questionId: string;
  bestPractices: BestPractice[];
}

export interface SelectedItem {
  pillar: string;
  question: string;
  bestPractices: {
      id: string;
      name: string;
      relevant: boolean;
      applied: boolean;
      recommendations?: string;
      extendedRecommendations?: string;
  }[];
}

export enum IaCTemplateType {
  CLOUDFORMATION_YAML = 'CloudFormation (.yaml) template',
  CLOUDFORMATION_JSON = 'CloudFormation (.json) template',
  TERRAFORM = 'Terraform (.tf) document',
  CDK_TYPESCRIPT = 'AWS CDK - TypeScript (.ts)',
  CDK_PYTHON = 'AWS CDK - Python (.py)',
  CDK_GO = 'AWS CDK - Go (.go)',
  CDK_JAVA = 'AWS CDK - Java (.java)',
  CDK_CSHARP = 'AWS CDK - C# (.cs)'
}

export * from './auth';

export interface WorkItem {
  // Partition and Sort Keys
  userId: string;           // Partition key (email hash)
  fileId: string;          // Sort key (file hash)
  
  // Attributes
  fileName: string;        // Original file name
  fileType: string;        // MIME type
  uploadDate: string;      // ISO timestamp
  
  // Analysis Status
  analysisStatus: WorkItemStatus;
  analysisProgress: number;
  analysisError?: string;
  analysisPartialResults?: boolean;
  
  // IaC Generation Status
  iacGenerationStatus: WorkItemStatus;
  iacGenerationProgress: number;
  iacGenerationError?: string;
  iacPartialResults?: boolean;
  
  // S3 References
  s3Prefix: string;        // Base S3 path for this work item
  
  // Metadata
  lastModified: string;    // Last activity timestamp
  tags?: string[];         // Optional user tags
  workloadId?: string;     // Associated WA Tool workload ID

  // Properties for multiple files support
  uploadMode?: FileUploadMode;
  exceedsTokenLimit?: boolean;
  tokenCount?: number;

  // Supporting document properties
  supportingDocumentId?: string;     // ID of the supporting document
  supportingDocumentAdded?: boolean; // Whether a supporting document was added
  supportingDocumentDescription?: string; // Description of the supporting document
  supportingDocumentName?: string;  // Name of the supporting document
  supportingDocumentType?: string;  // MIME type of the supporting document
  
  // IaC template type
  iacGeneratedFileType?: string;

  // Chat history flag
  hasChatHistory?: boolean;
}

export type WorkItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface WorkItemContent {
  data: string;
  contentType: string;
}

export interface WorkItemResponse {
  workItem: WorkItem;
  content?: WorkItemContent | string;
  analysisResults?: any;
  iacDocument?: string;
  hasChatHistory?: boolean;
}