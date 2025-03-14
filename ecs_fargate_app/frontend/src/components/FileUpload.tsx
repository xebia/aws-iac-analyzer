import React, { useState } from 'react';
import {
  FormField,
  Header,
  SpaceBetween,
  Alert,
  StatusIndicator,
  Spinner,
  FileUpload as CloudscapeFileUpload,
  SegmentedControl,
  Box
} from '@cloudscape-design/components';
import { FileUploadMode, UploadedFiles } from '../types';
import { HelpButton } from './utils/HelpButton';
import { storageApi } from '../services/storage';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFiles, fileId: string) => void;
  acceptedFileTypes: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  acceptedFileTypes,
}) => {
  const [value, setValue] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'initial' | 'success' | 'error'>('initial');
  const [uploadMode, setUploadMode] = useState<FileUploadMode>(FileUploadMode.SINGLE_FILE);

  // Helper function to check if a file is an image based on its extension
  const isImageFile = (file: File): boolean => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ['.png', '.jpg', '.jpeg'].includes(extension);
  };

  // Filter options based on the current mode
  const getAcceptedTypesForMode = (): string[] => {
    if (uploadMode === FileUploadMode.ZIP_FILE) {
      return ['.zip'];
    } else {
      // For single or multiple files, exclude zip files
      return acceptedFileTypes.filter(type => type !== '.zip');
    }
  };

  const handleFileChange = async (files: File[]) => {
    setValue(files);
    setError(null);

    if (!files.length) {
      return;
    }

    // Determine the actual upload mode based on number of files
    let actualUploadMode = uploadMode;
    if (uploadMode === FileUploadMode.SINGLE_FILE) {
      // If user uploaded more than 1 file in "Single or Multiple Files" mode,
      // switch to multiple files mode internally
      actualUploadMode = files.length > 1 ? FileUploadMode.MULTIPLE_FILES : FileUploadMode.SINGLE_FILE;
    }

    // Get accepted file types for current mode
    const acceptedTypes = getAcceptedTypesForMode();
    
    // Validate file types
    const invalidFiles = files.filter(file => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      return !acceptedTypes.includes(extension);
    });

    if (invalidFiles.length > 0) {
      const invalidNames = invalidFiles.map(f => f.name).join(', ');
      setError(`The following files are not allowed: ${invalidNames}`);
      return;
    }

    // Check if there are multiple image files (new requirement)
    const imageFiles = files.filter(file => isImageFile(file));
    if (imageFiles.length > 1) {
      setError('Only one image file (.png, .jpg, .jpeg) can be uploaded at a time.');
      return;
    }
    
    // For multiple files, check if there are mixed file types that aren't allowed together
    if (actualUploadMode === FileUploadMode.MULTIPLE_FILES && files.length > 1) {
      // Check if there are image files mixed with non-image files
      if (imageFiles.length > 0 && files.length > imageFiles.length) {
        setError('Cannot mix image files (.png, .jpg, .jpeg) with other file types.');
        return;
      }
    }

    try {
      setIsUploading(true);

      // Create FormData
      const formData = new FormData();
      
      // Add upload mode to the request
      formData.append('mode', actualUploadMode);
      
      // Add files to FormData
      files.forEach(file => {
        formData.append('files', file);
      });

      // Upload file(s) to S3 and create work item
      const response = await storageApi.uploadFiles(formData);

      if (!response || !response.fileId) {
        throw new Error('Invalid server response');
      }

      // Prepare response based on upload mode
      let uploadedFiles: UploadedFiles = {
        mode: actualUploadMode,
      };

      if (actualUploadMode === FileUploadMode.SINGLE_FILE) {
        const file = files[0];
        const fileType = determineFileType(file);

        uploadedFiles.singleFile = {
          name: file.name,
          content: '', // Content is stored in S3
          type: fileType,
          size: file.size,
        };
      } 
      else if (actualUploadMode === FileUploadMode.MULTIPLE_FILES) {
        uploadedFiles.multipleFiles = files.map(file => ({
          name: file.name,
          content: '', // Content is stored in S3
          type: determineFileType(file),
          size: file.size,
        }));
        
        // Add token count information if available
        if (response.tokenCount) {
          uploadedFiles.tokenCount = response.tokenCount;
          uploadedFiles.exceedsTokenLimit = response.exceedsTokenLimit;
        }
      }
      else if (actualUploadMode === FileUploadMode.ZIP_FILE) {
        const file = files[0];
        uploadedFiles.zipFile = {
          name: file.name,
          content: '', // Content is stored in S3
          type: file.type,
          size: file.size,
        };
        
        // Add token count information if available
        if (response.tokenCount) {
          uploadedFiles.tokenCount = response.tokenCount;
          uploadedFiles.exceedsTokenLimit = response.exceedsTokenLimit;
        }
      }

      setUploadStatus('success');
      onFileUploaded(uploadedFiles, response.fileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const determineFileType = (file: File): string => {
    // For files with special extensions
    if (file.name.endsWith('.tf')) return 'application/terraform';
    if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) return 'application/yaml';
    if (file.name.endsWith('.json')) return 'application/json';
    
    // For standard MIME types
    return file.type;
  };

  return (
    <SpaceBetween size="l">
      <FormField
        label={
          <>
            <Header variant="h3">
              1. Upload your IaC document or architecture diagram image <HelpButton contentId="fileUpload" />
            </Header>
          </>
        }
        errorText={error}
      >
        <SpaceBetween size="s">
          <SegmentedControl
            selectedId={uploadMode}
            onChange={({ detail }) => {
              setUploadMode(detail.selectedId as FileUploadMode);
              setValue([]);
              setError(null);
              setUploadStatus('initial');
            }}
            label="Upload mode"
            options={[
              {
                id: FileUploadMode.SINGLE_FILE,
                text: "Single or Multiple Files"
              },
              {
                id: FileUploadMode.ZIP_FILE,
                text: "Complete IaC Project"
              }
            ]}
          />
          
          {uploadMode === FileUploadMode.SINGLE_FILE && (
            <Box>Upload single or multiple related IaC documents. Or, upload a single architecture diagram image.</Box>
          )}
          
          {uploadMode === FileUploadMode.ZIP_FILE && (
            <Box>Upload a .zip file containing your IaC project or repository files. Binary and media files in the zip will be excluded.</Box>
          )}

          <CloudscapeFileUpload
            onChange={({ detail }) => handleFileChange(detail.value)}
            value={value}
            constraintText={`Supported file types: ${getAcceptedTypesForMode().join(' or ')}`}
            accept={getAcceptedTypesForMode().join(',')}
            i18nStrings={{
              uploadButtonText: () => isUploading ? 'Uploading...' : 'Choose files',
              dropzoneText: () => {
                if (isUploading) return 'Uploading...';
                
                switch(uploadMode) {
                  case FileUploadMode.SINGLE_FILE:
                    return 'Drop file(s) to upload';
                  case FileUploadMode.ZIP_FILE:
                    return 'Drop ZIP file to upload';
                  default:
                    return 'Drop file(s) to upload';
                }
              },
              removeFileAriaLabel: i => `Remove ${i + 1}`,
            }}
            showFileLastModified
            showFileSize
            multiple={uploadMode === FileUploadMode.SINGLE_FILE}
            tokenLimit={uploadMode === FileUploadMode.ZIP_FILE ? 1 : undefined}
          />
          {isUploading && (
            <Spinner />
          )}
          {uploadStatus === 'success' && !isUploading && (
            <StatusIndicator type="success">
              File{value.length > 1 ? 's' : ''} uploaded successfully
            </StatusIndicator>
          )}
        </SpaceBetween>
      </FormField>

      {error && (
        <Alert type="error" header="Error uploading file">
          {error}
        </Alert>
      )}
    </SpaceBetween>
  );
};