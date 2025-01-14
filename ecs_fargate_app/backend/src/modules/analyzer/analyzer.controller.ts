import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { AnalyzeRequestDto, IaCTemplateType } from '../../shared/dto/analysis.dto';

@Controller('analyzer')
export class AnalyzerController {
  private readonly logger = new Logger(AnalyzerController.name);

  constructor(private readonly analyzerService: AnalyzerService) { }

  @Post('analyze')
  async analyze(@Body() analyzeRequest: AnalyzeRequestDto) {
    try {
      return await this.analyzerService.analyze(
        analyzeRequest.fileContent,
        analyzeRequest.workloadId,
        analyzeRequest.selectedPillars,
        analyzeRequest.fileType
      );
    } catch (error) {
      this.logger.error('Analysis failed:', error);
      throw new HttpException(
        `Failed to analyze template: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-iac')
  async generateIacDocument(@Body() body: {
    fileContent: string;
    fileName: string;
    fileType: string;
    recommendations: any[];
    templateType: IaCTemplateType;
  }) {
    try {
      const result = await this.analyzerService.generateIacDocument(
        body.fileContent,
        body.fileName,
        body.fileType,
        body.recommendations,
        body.templateType
      );
      return result;
    } catch (error) {
      this.logger.error('IaC generation failed:', error);
      return {
        content: '',
        isCancelled: false,
        error: error instanceof Error ? error.message : 'Failed to generate IaC document'
      };
    }
  }

  @Post('get-more-details')
  async getMoreDetails(@Body() body: {
    selectedItems: any[];
    fileContent: string;
    fileType: string;
    templateType?: IaCTemplateType;
  }) {
    try {
      const result = await this.analyzerService.getMoreDetails(
        body.selectedItems,
        body.fileContent,
        body.fileType,
        body.templateType
      );
      return result;
    } catch (error) {
      this.logger.error('Getting more details failed:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Failed to get detailed analysis'
      };
    }
  }

  @Post('cancel-iac-generation')
  async cancelIaCGeneration() {
    this.analyzerService.cancelIaCGeneration();
    return { message: 'Generation cancelled successfully' };
  }

  @Post('cancel-analysis')
  async cancelAnalysis() {
    try {
      this.analyzerService.cancelAnalysis();
      return { message: 'Analysis cancelled' };
    } catch (error) {
      this.logger.error('Failed to cancel analysis:', error);
      throw new HttpException(
        `Failed to cancel analysis: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}