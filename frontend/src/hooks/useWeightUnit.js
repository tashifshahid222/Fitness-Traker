import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { formatWeight, fromKg, toKg } from '../utils/format';

const isNullish = (value) => value === null || value === undefined || value === '';

export function useWeightUnit() {
  const { user } = useAuth();
  const unit = user?.preferences?.weightUnit === 'lb' ? 'lb' : 'kg';

  return useMemo(
    () => ({
      unit,
      label: unit,
      display: (kg) => formatWeight(kg, unit),
      amount: (kg) => (isNullish(kg) ? kg : Math.round(fromKg(kg, unit) * 10) / 10),
      raw: (kg) => (isNullish(kg) ? kg : fromKg(kg, unit)),
      toKg: (value) => toKg(value, unit),
    }),
    [unit]
  );
}

export default useWeightUnit;
