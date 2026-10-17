/**
 * Shared French labels for domain enums.
 * Single source of truth — do not duplicate these maps in screens.
 */
import type { IconName } from '@/components/ui/Icon';
import type { ContributionFrequency, GroupType } from '@/services/group.service';
import type { Transaction } from '@/services/transaction.service';

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  tontine: 'Tontine',
  association: 'Association',
  family: 'Famille',
  friends: 'Amis',
  project: 'Projet',
};

export const GROUP_TYPE_ICONS: Record<GroupType, IconName> = {
  tontine: 'refresh',
  association: 'bank',
  family: 'home',
  friends: 'users',
  project: 'flag',
};

export const GROUP_TYPES = Object.keys(GROUP_TYPE_LABELS) as GroupType[];

export const FREQUENCY_LABELS: Record<ContributionFrequency, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  custom: 'Personnalisée',
};

export const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as ContributionFrequency[];

type PaymentMethodType = NonNullable<Transaction['paymentMethod']>['type'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  mobile_money: 'Mobile Money',
  cash: 'Espèces',
  bank_transfer: 'Autre',
  card: 'Carte bancaire',
};

export const MOBILE_MONEY_OPERATOR_LABELS: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  moov_money: 'Moov Money',
};

export const TRANSACTION_TYPE_LABELS: Record<Transaction['type'], string> = {
  contribution: 'Cotisation',
  expense: 'Dépense',
  refund: 'Remboursement',
  adjustment: 'Ajustement',
};

export const TRANSACTION_STATUS_LABELS: Record<Transaction['status'], string> = {
  completed: 'Terminée',
  pending: 'En attente',
  failed: 'Échouée',
  cancelled: 'Annulée',
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  loan: 'Prêt',
  investment: 'Investissement',
  charity: 'Charité',
  event: 'Événement',
  emergency: 'Urgence',
  other: 'Autre',
};

const lookup =
  (map: Record<string, string>) =>
  (key?: string | null): string =>
    key ? (map[key] ?? key) : '';

export const getGroupTypeLabel = lookup(GROUP_TYPE_LABELS);
export const getFrequencyLabel = lookup(FREQUENCY_LABELS);
export const getPaymentMethodLabel = lookup(PAYMENT_METHOD_LABELS);
export const getOperatorLabel = lookup(MOBILE_MONEY_OPERATOR_LABELS);
export const getTransactionTypeLabel = lookup(TRANSACTION_TYPE_LABELS);
export const getTransactionStatusLabel = lookup(TRANSACTION_STATUS_LABELS);
export const getCategoryLabel = lookup(TRANSACTION_CATEGORY_LABELS);
