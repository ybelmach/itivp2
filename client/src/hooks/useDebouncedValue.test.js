import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('значение обновляется только после паузы', () => {
  const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 400), { initialProps: { v: 'a' } });
  rerender({ v: 'ab' });
  rerender({ v: 'abc' });
  act(() => vi.advanceTimersByTime(399));
  expect(result.current).toBe('a');
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBe('abc');
});
