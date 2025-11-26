# Model Initialization Refactoring Guide

## Problem
72 model files call `.init()` at module import time, causing "No Sequelize instance passed" errors. The `.init()` method needs the Sequelize instance to be fully initialized, but it runs before that happens.

## Solution Pattern

### Before (Immediate Initialization - BROKEN):
```typescript
import { sequelize } from '../config/database';

export class ModelName extends Model {
  // ... fields ...
}

// This runs at import time - BEFORE sequelize is ready!
ModelName.init({ /* schema */ }, { sequelize, /* options */ });
```

### After (Deferred Initialization - FIXED):
```typescript
import { Sequelize } from 'sequelize';  // Note: Import type, not instance

export class ModelName extends Model {
  // ... fields ...

  // Add static method declaration
  static initializeModel: (sequelize: Sequelize) => typeof ModelName;
}

// Define initialization function (called AFTER sequelize is ready)
ModelName.initializeModel = function(sequelizeInstance: Sequelize) {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance required for ModelName initialization');
  }

  ModelName.init(
    { /* schema */ },
    {
      sequelize: sequelizeInstance,  // Use parameter instead of import
      /* options */
    }
  );

  // Define associations
  ModelName.belongsTo(OtherModel, { /* ... */ });

  return ModelName;
};
```

## Refactoring Checklist

For each model file:

- [ ] Remove `import { sequelize } from '../config/database'` or similar
- [ ] Add `Sequelize` to imports: `import { ..., Sequelize } from 'sequelize'`
- [ ] Add static method declaration in class: `static initializeModel: (sequelize: Sequelize) => typeof ModelName;`
- [ ] Wrap `.init()` call in `ModelName.initializeModel = function(sequelizeInstance: Sequelize) { ... }`
- [ ] Change `sequelize` reference to `sequelizeInstance` in init options
- [ ] Move any associations inside the initializeModel function
- [ ] Remove `if (process.env.NODE_ENV !== 'test')` wrapper if present
- [ ] Add comment: `// ModelName.init(...) will be called via ModelName.initializeModel() after database is ready`
- [ ] Add model to `/src/models/modelInitializer.ts`

## Completed Models (5/72)

✅ src/models/financial/CostTracking.ts
✅ src/models/financial/FinancialSnapshot.ts
✅ src/models/AIInteraction.ts
✅ src/models/AIFeedback.ts
✅ src/models/CoachPackage.ts (includes ClientCoachPackage)
✅ src/models/CoachProfile.ts

## In Progress - High Priority (11 files)

These models still import from config/database and need immediate attention:

1. src/models/CoachReview.ts
2. src/models/CoachSession.ts
3. src/models/financial/RevenueAnalytics.ts
4. src/models/Referral.ts
5. src/models/cms/ContentArticle.ts
6. src/models/cms/ContentComment.ts
7. src/models/cms/ContentInteraction.ts
8. src/models/cms/ContentSchedule.ts
9. src/models/cms/ContentTemplate.ts
10. src/models/cms/ContentVersion.ts
11. src/models/experiments/ExperimentAssignment.ts

## Model Initializer Updates

After refactoring each model, add it to `src/models/modelInitializer.ts`:

```typescript
import { ModelName } from './path/to/ModelName';

export async function initializeAllModels(sequelize: Sequelize): Promise<void> {
  const modelsToInitialize = [
    // ... existing models
    ModelName,  // Add your model here
  ];

  // ... initialization logic
}
```

## Testing

After refactoring:

1. Verify no "No Sequelize instance passed" errors on server startup
2. Check that all model associations work correctly
3. Ensure no circular dependency issues
4. Run existing test suite to verify functionality preserved

## Common Pitfalls

1. **Forgetting to change `sequelize` to `sequelizeInstance`** in init options
2. **Leaving associations outside the initializeModel function** - they won't run
3. **Not removing the database import** - causes circular dependencies
4. **Missing the static method declaration** - TypeScript will complain
5. **Not adding to modelInitializer.ts** - model won't be initialized at startup

## Files Modified

- `/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/src/models/financial/FinancialSnapshot.ts`
- `/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/src/models/AIInteraction.ts`
- `/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/src/models/AIFeedback.ts`
- `/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/src/models/CoachPackage.ts`
- `/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/src/models/CoachProfile.ts`

## Automation Script

A Node.js script has been created at `/Users/ardisetiadharma/CURSOR Repository/UpCoach/services/api/fix-models.js` to help automate the remaining refactoring work.
