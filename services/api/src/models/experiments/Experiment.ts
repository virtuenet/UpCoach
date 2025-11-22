import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export interface ExperimentAttributes {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  variants: ExperimentVariant[];
  trafficAllocation: number; // Percentage of traffic to include (0-100)
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  successCriteria: SuccessCriteria;
  segmentation?: SegmentationRules;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // Percentage allocation (0-100)
  configuration: Record<string, any>;
  isControl: boolean;
}

export interface SuccessCriteria {
  primaryMetric: string;
  minimumDetectableEffect: number; // Percentage
  confidenceLevel: number; // e.g., 95
  statisticalPower: number; // e.g., 80
  minimumSampleSize: number;
}

export interface SegmentationRules {
  includeRules: SegmentRule[];
  excludeRules: SegmentRule[];
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

interface ExperimentCreationAttributes
  extends Optional<ExperimentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'endDate'> {}

class Experiment
  extends Model<ExperimentAttributes, ExperimentCreationAttributes>
  implements ExperimentAttributes
{
  public id!: string;
  public name!: string;
  public description!: string;
  public status!: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  public variants!: ExperimentVariant[];
  public trafficAllocation!: number;
  public startDate!: Date;
  public endDate?: Date;
  public targetMetric!: string;
  public successCriteria!: SuccessCriteria;
  public segmentation?: SegmentationRules;
  public createdBy!: string;
  public updatedBy!: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  public isActive(): boolean {
    const now = new Date();
    return (
      this.status === 'active' && this.startDate <= now && (!this.endDate || this.endDate > now)
    );
  }

  public getVariantByAllocation(hash: number): ExperimentVariant | null {
    if (!this.isActive()) return null;

    let cumulativeAllocation = 0;
    for (const variant of this.variants) {
      cumulativeAllocation += variant.allocation;
      if (hash <= cumulativeAllocation) {
        return variant;
      }
    }
    return null;
  }

  public validateVariantAllocations(): boolean {
    const totalAllocation = this.variants.reduce((sum, variant) => sum + variant.allocation, 0);
    return Math.abs(totalAllocation - 100) < 0.01; // Allow for floating point precision
  }
}

Experiment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'archived'),
      defaultValue: 'draft',
      allowNull: false,
    },
    variants: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidVariants(value: ExperimentVariant[]) {
          if (!Array.isArray(value) || value.length < 2) {
            throw new Error('Experiment must have at least 2 variants');
          }

          const controlVariants = value.filter(v => v.isControl);
          if (controlVariants.length !== 1) {
            throw new Error('Experiment must have exactly one control variant');
          }

          const totalAllocation = value.reduce((sum, variant) => sum + variant.allocation, 0);
          if (Math.abs(totalAllocation - 100) > 0.01) {
            throw new Error('Variant allocations must sum to 100%');
          }
        },
      },
    },
    trafficAllocation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 100,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isAfterStartDate(this: unknown, value: Date) {
          if (value && value <= this.startDate) {
            throw new Error('End date must be after start date');
          }
        },
      },
    },
    targetMetric: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    successCriteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidCriteria(value: SuccessCriteria) {
          if (!value.primaryMetric || !value.minimumDetectableEffect || !value.confidenceLevel) {
            throw new Error(
              'Success criteria must include primaryMetric, minimumDetectableEffect, and confidenceLevel'
            );
          }
          if (value.confidenceLevel < 80 || value.confidenceLevel > 99) {
            throw new Error('Confidence level must be between 80 and 99');
          }
          if (value.statisticalPower < 70 || value.statisticalPower > 95) {
            throw new Error('Statistical power must be between 70 and 95');
          }
        },
      },
    },
    segmentation: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  } as unknown,
  {
    sequelize,
    modelName: 'Experiment',
    tableName: 'experiments',
    timestamps: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['startDate', 'endDate'],
      },
      {
        fields: ['createdBy'],
      },
    ],
  }
);

export { Experiment };
