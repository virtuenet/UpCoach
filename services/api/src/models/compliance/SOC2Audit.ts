import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/sequelize';

export interface SOC2AuditAttributes {
  id: string;
  auditId: string;
  auditType: 'type1' | 'type2';
  period: {
    startDate: Date;
    endDate: Date;
  };
  auditor: string;
  status: 'planned' | 'in_progress' | 'completed' | 'issued';
  scope: string[];
  findings: any[];
  recommendations: any[];
  reviewDate?: Date;
  findingsCount: number;
  inappropriateAccess: boolean;
  reportUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SOC2AuditCreationAttributes extends Optional<SOC2AuditAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SOC2Audit extends Model<SOC2AuditAttributes, SOC2AuditCreationAttributes>
  implements SOC2AuditAttributes {
  public id!: string;
  public auditId!: string;
  public auditType!: 'type1' | 'type2';
  public period!: {
    startDate: Date;
    endDate: Date;
  };
  public auditor!: string;
  public status!: 'planned' | 'in_progress' | 'completed' | 'issued';
  public scope!: string[];
  public findings!: any[];
  public recommendations!: any[];
  public reviewDate?: Date;
  public findingsCount!: number;
  public inappropriateAccess!: boolean;
  public reportUrl?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SOC2Audit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    auditId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    auditType: {
      type: DataTypes.ENUM('type1', 'type2'),
      allowNull: false,
    },
    period: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    auditor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'issued'),
      allowNull: false,
      defaultValue: 'planned',
    },
    scope: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
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
    reviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    findingsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    inappropriateAccess: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reportUrl: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: 'SOC2Audit',
    tableName: 'soc2_audits',
    timestamps: true,
  }
);