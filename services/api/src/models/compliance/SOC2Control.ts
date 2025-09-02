import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/sequelize';

export interface SOC2ControlAttributes {
  id: string;
  controlId: string;
  criteria: string;
  category: string;
  description: string;
  implementation: string;
  status: 'draft' | 'implemented' | 'testing' | 'active' | 'remediation_required';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  reviewDate: Date;
  nextReviewDate: Date;
  testingFrequency: string;
  testing?: {
    lastTestDate?: Date;
    testResult?: string;
    testEvidence?: string;
    testNotes?: string;
  };
  remediationRequired: boolean;
  findings?: any[];
  evidence?: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface SOC2ControlCreationAttributes extends Optional<SOC2ControlAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SOC2Control extends Model<SOC2ControlAttributes, SOC2ControlCreationAttributes>
  implements SOC2ControlAttributes {
  public id!: string;
  public controlId!: string;
  public criteria!: string;
  public category!: string;
  public description!: string;
  public implementation!: string;
  public status!: 'draft' | 'implemented' | 'testing' | 'active' | 'remediation_required';
  public riskLevel!: 'low' | 'medium' | 'high' | 'critical';
  public owner!: string;
  public reviewDate!: Date;
  public nextReviewDate!: Date;
  public testingFrequency!: string;
  public testing?: {
    lastTestDate?: Date;
    testResult?: string;
    testEvidence?: string;
    testNotes?: string;
  };
  public remediationRequired!: boolean;
  public findings?: any[];
  public evidence?: any[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SOC2Control.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    controlId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    criteria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    implementation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'implemented', 'testing', 'active', 'remediation_required'),
      allowNull: false,
      defaultValue: 'draft',
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reviewDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    nextReviewDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    testingFrequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    testing: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    remediationRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    findings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    evidence: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SOC2Control',
    tableName: 'soc2_controls',
    timestamps: true,
  }
);