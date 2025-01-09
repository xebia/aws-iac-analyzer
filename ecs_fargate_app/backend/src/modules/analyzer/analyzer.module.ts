import { Module } from '@nestjs/common';
import { AnalyzerController } from './analyzer.controller';
import { AnalyzerService } from './analyzer.service';
import { AnalyzerGateway } from './analyzer.gateway';
import { AwsConfigService } from '../../config/aws.config';

@Module({
  controllers: [AnalyzerController],
  providers: [AnalyzerService, AnalyzerGateway, AwsConfigService],
  exports: [AnalyzerService]
})
export class AnalyzerModule {}