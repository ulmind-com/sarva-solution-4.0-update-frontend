import api from '@/lib/api';

/**
 * Bonus Qualifiers (read-only)
 * ---------------------------------------------------------------------------
 * The pool tables show a qualifier count but not who those qualifiers were.
 * These calls fetch the actual credited members for one pool.
 *
 * Self Repurchase is not covered here — it already has its own per-user screen.
 */

export type BonusType =
    | 'beginner'
    | 'startup'
    | 'leadership'
    | 'tour-fund'
    | 'health-education'
    | 'bike-car-fund'
    | 'house-fund'
    | 'royalty-fund'
    | 'ssvpl-super';

/** Whichever period fields the bonus uses — monthly, half-yearly or yearly. */
export interface BonusPeriodQuery {
    poolId?: string;
    year?: number;
    month?: number;
    cycleYear?: number;
    cycleNumber?: number;
}

export interface BonusQualifier {
    userId: string;
    memberId: string | null;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    accountStatus: string | null;
    finalUnits: number;
    perUnitValue: number;
    grossCredit: number;
    adminCharge: number;
    tds: number;
    netCredit: number;
    creditedAt: string | null;
}

export interface BonusQualifiersResponse {
    bonusType: BonusType;
    label: string;
    periodType: 'monthly' | 'half-yearly' | 'yearly';
    period: Record<string, number>;
    periodLabel: string;
    pool: {
        poolId: string;
        status: string;
        companyTotalBV: number;
        poolPercent: number;
        poolAmount: number;
        totalUnits: number;
        perUnitValue: number;
        eligibleUserCount: number;
        adminChargePercent: number;
        tdsPercent: number;
        distributedAt: string | null;
    };
    totals: {
        qualifierCount: number;
        totalUnits: number;
        totalGross: number;
        totalAdminCharge: number;
        totalTds: number;
        totalNet: number;
    };
    /** Flags a pool whose stored count disagrees with the credit rows found. */
    check: {
        poolEligibleUserCount: number;
        creditRowsFound: number;
        matches: boolean;
    };
    pagination: { page: number; limit: number; total: number; pages: number };
    qualifiers: BonusQualifier[];
}

/**
 * Members actually credited from one pool.
 * Returns null when no pool exists for that period.
 */
export const getBonusQualifiers = async (
    bonusType: BonusType,
    period: BonusPeriodQuery,
    opts: { search?: string; page?: number; limit?: number } = {}
): Promise<BonusQualifiersResponse | null> => {
    const response = await api.get(`/api/v1/admin/bonus-qualifiers/${bonusType}/qualifiers`, {
        params: { ...period, ...opts }
    });
    return response.data?.data ?? null;
};
