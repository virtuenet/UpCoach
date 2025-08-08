# A/B Testing Framework Documentation

## Overview

The UpCoach landing page includes a comprehensive A/B testing framework that allows us to run experiments and optimize conversion rates.

## Features

- **Client-side variant assignment** with persistent storage
- **Weight-based distribution** for flexible traffic allocation
- **Target audience segmentation** (new/returning users, device type, location)
- **Google Analytics 4 integration** for tracking
- **React hooks** for easy implementation
- **Development dashboard** for testing (Cmd+Shift+E)

## Current Experiments

### 1. Hero Button Color Test (`heroButtonColor`)

- **Control**: Solid primary color button
- **Variant A**: Gradient button with hover effect
- **Goal**: Test which button style drives more downloads

### 2. Lead Magnet Copy (`leadMagnetCopy`)

- **Control**: "Productivity Guide"
- **Variant A**: "Habit Tracker Template"
- **Variant B**: "AI Coaching Secrets"
- **Goal**: Find the most compelling lead magnet

### 3. Pricing Layout (`pricingLayout`)

- **Control**: Horizontal layout
- **Variant A**: Vertical with emphasized popular plan
- **Goal**: Optimize pricing conversion

## Implementation Guide

### Basic Usage

```tsx
import { useExperiment } from "@/services/experiments";
import { ABTestSwitch, Variant } from "@/components/experiments/ABTest";

function MyComponent() {
  const { variant, trackConversion } = useExperiment("experimentId");

  // Track conversions
  const handleClick = () => {
    trackConversion("button_click", 1);
  };

  return (
    <ABTestSwitch experimentId="experimentId">
      <Variant variant="control">
        <button onClick={handleClick}>Original Button</button>
      </Variant>
      <Variant variant="variant-a">
        <button onClick={handleClick}>New Button</button>
      </Variant>
    </ABTestSwitch>
  );
}
```

### Creating New Experiments

1. Add experiment configuration to `experiments.ts`:

```typescript
export const experiments: Record<string, Experiment> = {
  myNewTest: {
    id: "my-new-test",
    name: "My New Test",
    description: "Testing something new",
    status: "running",
    variants: [
      { id: "control", name: "Original", weight: 50 },
      { id: "variant-a", name: "Variation", weight: 50 },
    ],
  },
};
```

2. Implement in your component using `ABTestSwitch` and `Variant`

3. Track conversions with `trackConversion()`

### Targeting Options

```typescript
targetAudience: {
  newUsers: true,           // Only new users
  returningUsers: false,    // Exclude returning users
  device: ['mobile'],       // Mobile only
  location: ['US', 'CA']    // Specific countries
}
```

## Analytics Integration

All experiments automatically track:

- **Variant assignment**: When a user is assigned to a variant
- **Conversions**: Custom events you track with `trackConversion()`

Events are sent to Google Analytics 4 with:

- `experiment_id`
- `variant_id`
- `user_id`
- `conversion_type` (for conversions)
- `value` (optional conversion value)

## Best Practices

1. **Run experiments for statistical significance** (usually 2-4 weeks)
2. **Don't change experiments mid-flight** - this invalidates results
3. **Track meaningful conversions** - not just clicks but actual goals
4. **Use descriptive experiment names** for easy analysis
5. **Document your hypotheses** before starting experiments

## Testing in Development

1. Press `Cmd+Shift+E` to open the experiment dashboard
2. See your current variant assignments
3. Click "Reset All Experiments" to get reassigned
4. Test different variants by clearing localStorage

## Analyzing Results

View experiment results in Google Analytics 4:

1. Go to **Explore** → **Free Form**
2. Add dimensions: `experiment_id`, `variant_id`
3. Add metrics: `experiment_conversion` events
4. Filter by specific experiment IDs

## Deployment Checklist

- [ ] Define clear success metrics
- [ ] Set experiment duration (2-4 weeks recommended)
- [ ] QA all variants thoroughly
- [ ] Set up GA4 dashboards for monitoring
- [ ] Document experiment hypothesis
- [ ] Plan for post-experiment implementation
