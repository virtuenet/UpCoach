#!/bin/bash

# Fix ForumController error types
sed -i '' 's/logger.error(\(.*\), error)/logger.error(\1, error as Error)/g' src/controllers/community/ForumController.ts
sed -i '' 's/message: error\.message/message: (error as Error).message/g' src/controllers/community/ForumController.ts

# Fix unused params in FinancialDashboardController
sed -i '' 's/async getSubscriptionMetrics(req: Request/async getSubscriptionMetrics(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getMRRMetrics(req: Request/async getMRRMetrics(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getARRMetrics(req: Request/async getARRMetrics(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getRevenueByCountry(req: Request/async getRevenueByCountry(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getActiveSubscriptions(req: Request/async getActiveSubscriptions(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getLTVAnalytics(req: Request/async getLTVAnalytics(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getCostOptimizationSuggestions(req: Request/async getCostOptimizationSuggestions(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getUnitEconomics(req: Request/async getUnitEconomics(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getLTVtoCACRatio(req: Request/async getLTVtoCACRatio(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getAutomationStatus(req: Request/async getAutomationStatus(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/async getScheduledJobs(req: Request/async getScheduledJobs(_req: Request/g' src/controllers/financial/FinancialDashboardController.ts

# Fix error types in FinancialDashboardController
sed -i '' 's/error\.statusCode/(error as any).statusCode/g' src/controllers/financial/FinancialDashboardController.ts

# Fix unused variables
sed -i '' 's/const period = req.params.period/const period = req.params.period as string/g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/const months = /const _months = /g' src/controllers/financial/FinancialDashboardController.ts
sed -i '' 's/const recipients = /const _recipients = /g' src/controllers/financial/FinancialDashboardController.ts

echo "Fixed remaining TypeScript errors"
