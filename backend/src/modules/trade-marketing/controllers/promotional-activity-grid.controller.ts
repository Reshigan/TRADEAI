// DEPRECATED: This module is not used in production. The Workers backend (workers-backend/)
// is the active production backend. This Express/NestJS controller is retained for reference only.

import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { PromotionalActivityGridService } from '../services/promotional-activity-grid.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CompanySpecificGuard } from '../../auth/guards/company-specific.guard';

@Controller('promotional-activity-grid')
@UseGuards(JwtAuthGuard, CompanySpecificGuard)
export class PromotionalActivityGridController {
  constructor(
    private promotionalActivityGridService: PromotionalActivityGridService
  ) {}

  @Get()
  async getPromotionalActivityGrid(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('hierarchyType') hierarchyType: 'product' | 'customer' = 'product',
    @Query('hierarchyLevel') hierarchyLevel?: number,
    @Query('timeGrouping') timeGrouping: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    return this.promotionalActivityGridService.getPromotionalActivityGrid({
      companyId,
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate)
      },
      hierarchyType,
      hierarchyLevel,
      timeGrouping
    });
  }

  @Get(':promotionId/details')
  async getPromotionalActivityDetails(
    @Param('promotionId') promotionId: string
  ) {
    return this.promotionalActivityGridService.getDetailedPromotionalActivity(promotionId);
  }

  @Get('export')
  async exportPromotionalActivityGrid(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'csv' | 'xlsx' | 'pdf' = 'xlsx'
  ) {
    const gridData = await this.promotionalActivityGridService.getPromotionalActivityGrid({
      companyId,
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate)
      },
      hierarchyType: 'product',
      timeGrouping: 'month'
    });

    // Export logic based on format
    switch (format) {
      case 'csv':
        return this.exportToCSV(gridData);
      case 'xlsx':
        return this.exportToXLSX(gridData);
      case 'pdf':
        return this.exportToPDF(gridData);
      default:
        return this.exportToXLSX(gridData);
    }
  }

  private exportToCSV(data: any[]) {
    // Implement CSV export logic
    return { message: 'CSV export not implemented' };
  }

  private exportToXLSX(data: any[]) {
    // Implement XLSX export logic
    return { message: 'XLSX export not implemented' };
  }

  private exportToPDF(data: any[]) {
    // Implement PDF export logic
    return { message: 'PDF export not implemented' };
  }
}
