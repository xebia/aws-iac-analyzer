import { FileUploadMode } from "../dto/analysis.dto";

export type WorkItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

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
  iacGeneratedFileType?: string;
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

  // Chat history flag
  hasChatHistory?: boolean;
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

export interface S3Locations {
  metadata: string;
  originalContent: string;
  analysisResults: string;
  iacDocument: string;
  packedContent?: string;
  supportingDocument?: string;
  chatHistory: string;
}

export interface StorageConfig {
  enabled: boolean;
  bucket?: string;
  table?: string;
}