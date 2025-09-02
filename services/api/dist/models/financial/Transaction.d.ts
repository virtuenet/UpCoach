import { Model, Optional, Association } from 'sequelize';
import { User } from '../User';
import { Subscription } from './Subscription';
export declare enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
export declare enum TransactionType {
    PAYMENT = "payment",
    REFUND = "refund",
    ADJUSTMENT = "adjustment",
    CHARGEBACK = "chargeback",
    PAYOUT = "payout"
}
export declare enum PaymentMethod {
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    PAYPAL = "paypal",
    CRYPTO = "crypto",
    OTHER = "other"
}
export interface TransactionAttributes {
    id: string;
    userId: string;
    subscriptionId?: string;
    stripeTransactionId: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    description?: string;
    metadata?: any;
    stripeInvoiceId?: string;
    stripeChargeId?: string;
    stripeRefundId?: string;
    failureReason?: string;
    refundedAmount?: number;
    fee?: number;
    net?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'subscriptionId' | 'description' | 'metadata' | 'stripeInvoiceId' | 'stripeChargeId' | 'stripeRefundId' | 'failureReason' | 'refundedAmount' | 'fee' | 'net' | 'createdAt' | 'updatedAt'> {
}
export declare class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
    id: string;
    userId: string;
    subscriptionId?: string;
    stripeTransactionId: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    description?: string;
    metadata?: any;
    stripeInvoiceId?: string;
    stripeChargeId?: string;
    stripeRefundId?: string;
    failureReason?: string;
    refundedAmount?: number;
    fee?: number;
    net?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly user?: User;
    readonly subscription?: Subscription;
    static associations: {
        user: Association<Transaction, User>;
        subscription: Association<Transaction, Subscription>;
    };
    get isRefundable(): boolean;
    get remainingRefundableAmount(): number;
    get netAmount(): number;
    static associate(models: any): void;
}
//# sourceMappingURL=Transaction.d.ts.map