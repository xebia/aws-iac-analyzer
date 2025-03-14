import { WorkItem, WorkItemResponse } from '../types';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/storage',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const storageApi = {
  // Supporting documents upload
  async uploadSupportingDocument(formData: FormData): Promise<{ fileId: string }> {
    try {
      const response = await api.post('/work-items/upload-supporting', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload supporting document'
      );
    }
  },

  // Supporting document download
  async downloadSupportingDocument(fileId: string, mainFileId: string, fileName: string): Promise<void> {
    try {
      // Updated endpoint to include main file ID
      const response = await api.get(`/work-items/${mainFileId}/supporting-document/${fileId}`, {
        responseType: 'arraybuffer'
      });

      // Get the content type from headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create blob from array buffer
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to download supporting document'
      );
    }
  },

  async uploadFiles(formData: FormData): Promise<{ fileId: string; tokenCount?: number; exceedsTokenLimit?: boolean }> {
    try {
      const response = await api.post('/work-items/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload files'
      );
    }
  },

  async listWorkItems(): Promise<WorkItem[]> {
    try {
      const response = await api.get('/work-items');
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to list work items'
      );
    }
  },

  async getWorkItem(fileId: string): Promise<WorkItemResponse> {
    try {
      const response = await api.get(`/work-items/${fileId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get work item'
      );
    }
  },

  async uploadFile(file: File): Promise<{ fileId: string }> {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/work-items/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload file'
      );
    }
  },

  async deleteWorkItem(fileId: string): Promise<void> {
    try {
      await api.delete(`/work-items/${fileId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete work item'
      );
    }
  },

  async downloadOriginalContent(fileId: string, fileName: string): Promise<void> {
    try {
      // Get the content with responseType arraybuffer for binary data
      const response = await api.get(`/work-items/${fileId}/content`, {
        responseType: 'arraybuffer'
      });

      // Get the content type from headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create blob from array buffer
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to download original content'
      );
    }
  }
};