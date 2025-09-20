# Financial Dashboard Export Functionality

This document describes the implementation of Excel and PDF export functionality for the Financial Dashboard.

## Overview

The export functionality has been implemented in the `FinancialDashboardController` to support exporting financial reports in three formats:
- **Excel (.xlsx)** - Professional spreadsheet format with formatting and formulas
- **PDF (.pdf)** - Print-ready document format with styling and branding
- **CSV (.csv)** - Simple comma-separated values format (already existing)

## Implementation Details

### Dependencies Required

To use the export functionality, you need to install the following dependencies:

```bash
# Run the installation script
./install-export-deps.sh

# Or install manually:
npm install exceljs puppeteer
npm install --save-dev @types/puppeteer
```

### API Endpoints

The export functionality is available through the existing endpoint:

```
GET /api/financial/reports/{reportId}/download?format={format}
```

**Parameters:**
- `reportId` (path): The ID of the report to export
- `format` (query): Export format - `excel`, `pdf`, or `csv` (default: `pdf`)

**Example Usage:**
```bash
# Export as Excel
GET /api/financial/reports/123/download?format=excel

# Export as PDF (default)
GET /api/financial/reports/123/download

# Export as CSV
GET /api/financial/reports/123/download?format=csv
```

### Features Implemented

#### Excel Export
- Professional formatting with branded headers
- Auto-sizing columns
- Data type formatting (currency, dates)
- Summary calculations for revenue reports
- Multiple worksheets support
- Styled headers with company branding

#### PDF Export
- Professional HTML-to-PDF conversion using Puppeteer
- Responsive table layout
- Header and footer with branding
- Summary statistics section
- Print-optimized formatting
- Page numbering and metadata

#### Enhanced Security & Validation
- Input parameter validation
- File size limits by format
- Filename sanitization
- Authorization checks (placeholder for implementation)
- Audit logging for all export activities

### Technical Implementation

#### New TypeScript Interfaces

```typescript
interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeMetadata?: boolean;
  includeCharts?: boolean;
  reportType?: string;
}

interface ReportData {
  date?: string;
  amount?: number;
  currency?: string;
  status?: string;
  country?: string;
  paymentMethod?: string;
  plan?: string;
  interval?: string;
  canceledAt?: string | null;
  userId?: string;
  createdAt?: string;
  [key: string]: any;
}

interface ExportSummary {
  totalItems: number;
  totalRevenue?: number;
  avgTransaction?: number;
  activeCount?: number;
  canceledCount?: number;
}
```

#### Key Methods Added

1. **`generateExcelReport()`** - Creates Excel files with ExcelJS
2. **`generatePDFReport()`** - Creates PDF files with Puppeteer
3. **`generatePDFHTML()`** - Generates HTML template for PDF conversion
4. **`validateExportParams()`** - Validates export parameters
5. **`validateDataSize()`** - Checks file size limits
6. **`sanitizeFilename()`** - Secures filenames
7. **`formatHeaderName()`** - Formats column headers for readability

### File Size Limits

- **PDF**: 50MB maximum
- **Excel**: 100MB maximum
- **CSV**: 10MB maximum

Large datasets will trigger an error suggesting to reduce the date range or use CSV format.

### Error Handling

The export functionality includes comprehensive error handling:

```typescript
// Parameter validation errors
400 - Invalid parameters: Invalid start date format

// Data availability errors
400 - No data available for export

// File size errors
413 - Report data is too large to export as Excel. Please reduce the date range or use CSV format.

// Authorization errors
403 - Insufficient permissions to access this report

// Not found errors
404 - Report not found

// General export errors
500 - Failed to generate Excel/PDF report
```

### Logging & Monitoring

All export activities are logged for audit purposes:

```typescript
// Export request logging
logger.info('Report export requested', {
  reportId: id,
  format,
  reportType: report.type,
  requestTime: new Date().toISOString()
});

// Export completion logging
logger.info('Report export completed successfully', {
  reportId: id,
  format,
  reportType: report.type,
  completionTime: new Date().toISOString()
});

// Export failure logging
logger.error('Report export failed', {
  reportId: req.params.id,
  format: req.query.format,
  error: (error as Error).message,
  stack: (error as Error).stack
});
```

## Usage Examples

### Frontend Integration

```javascript
// Download Excel report
const downloadExcel = async (reportId) => {
  const response = await fetch(`/api/financial/reports/${reportId}/download?format=excel`);
  const blob = await response.blob();

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financial-report-${reportId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Download PDF report
const downloadPDF = async (reportId) => {
  const response = await fetch(`/api/financial/reports/${reportId}/download?format=pdf`);
  const blob = await response.blob();

  // Open in new tab or download
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};
```

### cURL Examples

```bash
# Download Excel report
curl -X GET "http://localhost:3000/api/financial/reports/123/download?format=excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output "financial-report.xlsx"

# Download PDF report
curl -X GET "http://localhost:3000/api/financial/reports/123/download?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output "financial-report.pdf"
```

## Security Considerations

1. **Authentication**: All export endpoints require authentication via the `authMiddleware`
2. **Authorization**: Placeholder for role-based access control (implement `canUserAccessReport()`)
3. **Input Validation**: All parameters are validated before processing
4. **File Size Limits**: Prevents memory exhaustion attacks
5. **Filename Sanitization**: Prevents path traversal attacks
6. **Audit Logging**: All export activities are logged for compliance

## Performance Considerations

1. **Memory Usage**: Large reports are validated before processing to prevent memory issues
2. **Browser Resources**: PDF generation uses headless Chrome, which is automatically managed
3. **Timeout Handling**: Long-running exports have appropriate timeout settings
4. **Streaming**: Excel files are written directly to the response stream for efficiency

## Future Enhancements

1. **Caching**: Implement report caching for frequently requested exports
2. **Async Processing**: Queue large exports for background processing
3. **Templates**: Support for custom report templates
4. **Charts**: Include chart generation in PDF exports
5. **Compression**: Automatic compression for large files
6. **Email Delivery**: Option to email reports instead of direct download

## Troubleshooting

### Common Issues

1. **Dependencies not installed**: Run `./install-export-deps.sh`
2. **Puppeteer Chrome download fails**: Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and install Chrome manually
3. **Large file errors**: Reduce date range or use CSV format
4. **Permission errors**: Ensure proper authentication headers

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=financial:export npm start
```

## Testing

Create test reports and verify export functionality:

```bash
# Test Excel export
curl -X GET "http://localhost:3000/api/financial/reports/test-report/download?format=excel" -H "Authorization: Bearer $TOKEN" --output test.xlsx

# Test PDF export
curl -X GET "http://localhost:3000/api/financial/reports/test-report/download?format=pdf" -H "Authorization: Bearer $TOKEN" --output test.pdf
```

## Support

For issues or questions regarding the export functionality:
1. Check the application logs for detailed error messages
2. Verify all dependencies are properly installed
3. Ensure the report data exists and is accessible
4. Check file size limits if exports are failing