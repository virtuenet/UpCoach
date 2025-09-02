import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/sequelize';

export interface SOC2AssessmentAttributes {
  id: string;
  assessmentId: string;
  title: string;
  description: string;
  assessmentType: 'internal' | 'external' | 'third_party';
  scope: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  assessor: string;
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  findings: any[];
  recommendations: any[];
  nextReviewDate?: Date;
  evidence: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface SOC2AssessmentCreationAttributes extends Optional<SOC2AssessmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SOC2Assessment extends Model<SOC2AssessmentAttributes, SOC2AssessmentCreationAttributes>
  implements SOC2AssessmentAttributes {
  public id!: string;
  public assessmentId!: string;
  public title!: string;
  public description!: string;
  public assessmentType!: 'internal' | 'external' | 'third_party';
  public scope!: string[];
  public status!: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  public startDate!: Date;
  public endDate?: Date;
  public assessor!: string;
  public riskRating!: 'low' | 'medium' | 'high' | 'critical';
  public findings!: any[];
  public recommendations!: any[];
  public nextReviewDate?: Date;
  public evidence!: any[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SOC2Assessment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assessmentId: {
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
    assessmentType: {
      type: DataTypes.ENUM('internal', 'external', 'third_party'),
      allowNull: false,
    },
    scope: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'planned',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    assessor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    riskRating: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
    },
    findings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    recommendations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    nextReviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    evidence: {
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
    modelName: 'SOC2Assessment',
    tableName: 'soc2_assessments',
    timestamps: true,
  }
);