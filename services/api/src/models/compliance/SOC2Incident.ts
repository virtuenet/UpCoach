import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../../config/sequelize';

export interface SOC2IncidentAttributes {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  reportedDate: Date;
  detectedDate?: Date;
  resolvedDate?: Date;
  targetResolutionDate?: Date;
  impactAssessment: unknown;
  rootCause?: string;
  remediationActions: unknown[];
  lessons?: string;
  impactLevel: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedSystems: string[];
  communicationLog: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

interface SOC2IncidentCreationAttributes extends Optional<SOC2IncidentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SOC2Incident extends Model<SOC2IncidentAttributes, SOC2IncidentCreationAttributes>
  implements SOC2IncidentAttributes {
  public id!: string;
  public incidentId!: string;
  public title!: string;
  public description!: string;
  public category!: string;
  public severity!: 'low' | 'medium' | 'high' | 'critical';
  public status!: 'open' | 'investigating' | 'resolved' | 'closed';
  public reportedBy!: string;
  public assignedTo?: string;
  public reportedDate!: Date;
  public detectedDate?: Date;
  public resolvedDate?: Date;
  public targetResolutionDate?: Date;
  public impactAssessment!: unknown;
  public rootCause?: string;
  public remediationActions!: unknown[];
  public lessons?: string;
  public impactLevel!: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  public affectedSystems!: string[];
  public communicationLog!: unknown[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SOC2Incident.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    incidentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'investigating', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    reportedBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assignedTo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reportedDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    detectedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    targetResolutionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    impactAssessment: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    rootCause: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    remediationActions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    lessons: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    impactLevel: {
      type: DataTypes.ENUM('none', 'minimal', 'moderate', 'significant', 'severe'),
      allowNull: false,
      defaultValue: 'minimal',
    },
    affectedSystems: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    communicationLog: {
      type: DataTypes.JSON,
      allowNull: false,
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
    modelName: 'SOC2Incident',
    tableName: 'soc2_incidents',
    timestamps: true,
  }
);