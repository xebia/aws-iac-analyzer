import axios, { AxiosError } from 'axios';
import { AnalysisResult, RiskSummary, UploadedFile, IaCTemplateType } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 0, // Allow for long-running operations
});

// Move handleError outside as a standalone function
const handleError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;
    return new Error(
      axiosError.response?.data?.message ||
      axiosError.message ||
      'An unexpected error occurred'
    );
  }
  return new Error('An unexpected error occurred');
};

export const analyzerApi = {
  async analyze(
    file: UploadedFile,
    workloadId: string,
    selectedPillars: string[]
  ): Promise<{ results: AnalysisResult[]; isCancelled: boolean }> {
    try {
      const response = await api.post('/analyzer/analyze', {
        fileContent: file.content,
        fileName: file.name,
        fileType: file.type,
        workloadId,
        selectedPillars,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async cancelAnalysis(): Promise<void> {
    try {
      await api.post('/analyzer/cancel-analysis');
    } catch (error) {
      throw handleError(error);
    }
  },

  async updateWorkload(workloadId: string, questionId: string, selectedChoices: string[]) {
    try {
      const response = await api.post(`/well-architected/answer/${workloadId}`, {
        questionId,
        selectedChoices,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getRiskSummary(workloadId: string): Promise<RiskSummary[]> {
    try {
      const response = await api.get(`/well-architected/risk-summary/${workloadId}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async createMilestone(workloadId: string, milestoneName: string) {
    try {
      const response = await api.post('/well-architected/milestone', {
        workloadId,
        milestoneName,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async generateReport(workloadId: string): Promise<string> {
    try {
      const response = await api.post('/report/generate', { workloadId });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async generateRecommendations(results: AnalysisResult[]): Promise<string> {
    try {
      const response = await api.post('/report/recommendations', results);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async createWorkload(isTemp: boolean = false): Promise<string> {
    try {
      const response = await api.post('/well-architected/workload/create', {
        isTemp
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async deleteWorkload(workloadId: string): Promise<void> {
    try {
      await api.delete(`/well-architected/workload/${workloadId}`);
    } catch (error) {
      throw handleError(error);
    }
  },

  async generateIacDocument(
    fileContent: string,
    fileName: string,
    fileType: string,
    recommendations: AnalysisResult[],
    templateType: IaCTemplateType
  ): Promise<{ content: string; isCancelled: boolean }> {
    try {
      const response = await api.post('/analyzer/generate-iac', {
        fileContent,
        fileName,
        fileType,
        recommendations,
        templateType
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getMoreDetails(
    selectedItems: AnalysisResult[],
    fileContent: string,
    fileType: string,
    templateType: IaCTemplateType
  ): Promise<string> {
    try {
      const response = await api.post('/analyzer/get-more-details', {
        selectedItems,
        fileContent,
        fileType,
        templateType
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async cancelIaCGeneration(): Promise<void> {
    try {
      await api.post('/analyzer/cancel-iac-generation');
    } catch (error) {
      throw handleError(error);
    }
  }
};