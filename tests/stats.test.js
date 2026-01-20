// Tests for statistics calculation logic from popup.js and service-worker.js

/**
 * Calculate success rate - extracted from popup.js
 */
function calculateSuccessRate(imagesChecked, credentialsFound) {
  if (imagesChecked === 0) return 0;
  return ((credentialsFound / imagesChecked) * 100).toFixed(1);
}

/**
 * Determine if status should increment credentials found - from service-worker.js
 */
function shouldIncrementCredentialsFound(status) {
  return status === 'valid' || status === 'invalid' || status === 'expired';
}

/**
 * Update stats logic - extracted from service-worker.js
 */
function computeUpdatedStats(currentStats, newStatus) {
  const imagesChecked = (currentStats.imagesChecked || 0) + 1;
  let credentialsFound = currentStats.credentialsFound || 0;

  if (shouldIncrementCredentialsFound(newStatus)) {
    credentialsFound++;
  }

  return { imagesChecked, credentialsFound };
}

describe('calculateSuccessRate', () => {
  test('returns 0 when no images checked', () => {
    expect(calculateSuccessRate(0, 0)).toBe(0);
  });

  test('calculates 100% when all images have credentials', () => {
    expect(calculateSuccessRate(10, 10)).toBe('100.0');
  });

  test('calculates 50% correctly', () => {
    expect(calculateSuccessRate(10, 5)).toBe('50.0');
  });

  test('calculates fractional percentages', () => {
    expect(calculateSuccessRate(3, 1)).toBe('33.3');
  });

  test('handles single image checked with credentials', () => {
    expect(calculateSuccessRate(1, 1)).toBe('100.0');
  });

  test('handles single image checked without credentials', () => {
    expect(calculateSuccessRate(1, 0)).toBe('0.0');
  });

  test('handles large numbers', () => {
    expect(calculateSuccessRate(1000000, 123456)).toBe('12.3');
  });

  test('handles zero credentials found', () => {
    expect(calculateSuccessRate(100, 0)).toBe('0.0');
  });
});

describe('shouldIncrementCredentialsFound', () => {
  test('returns true for valid status', () => {
    expect(shouldIncrementCredentialsFound('valid')).toBe(true);
  });

  test('returns true for invalid status', () => {
    expect(shouldIncrementCredentialsFound('invalid')).toBe(true);
  });

  test('returns true for expired status', () => {
    expect(shouldIncrementCredentialsFound('expired')).toBe(true);
  });

  test('returns false for none status', () => {
    expect(shouldIncrementCredentialsFound('none')).toBe(false);
  });

  test('returns false for error status', () => {
    expect(shouldIncrementCredentialsFound('error')).toBe(false);
  });

  test('returns false for unknown status', () => {
    expect(shouldIncrementCredentialsFound('unknown')).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(shouldIncrementCredentialsFound(undefined)).toBe(false);
  });
});

describe('computeUpdatedStats', () => {
  test('initializes stats from empty state', () => {
    const result = computeUpdatedStats({}, 'none');
    expect(result.imagesChecked).toBe(1);
    expect(result.credentialsFound).toBe(0);
  });

  test('increments images checked', () => {
    const result = computeUpdatedStats({ imagesChecked: 5, credentialsFound: 2 }, 'none');
    expect(result.imagesChecked).toBe(6);
    expect(result.credentialsFound).toBe(2);
  });

  test('increments credentials found for valid status', () => {
    const result = computeUpdatedStats({ imagesChecked: 5, credentialsFound: 2 }, 'valid');
    expect(result.imagesChecked).toBe(6);
    expect(result.credentialsFound).toBe(3);
  });

  test('increments credentials found for invalid status', () => {
    const result = computeUpdatedStats({ imagesChecked: 5, credentialsFound: 2 }, 'invalid');
    expect(result.credentialsFound).toBe(3);
  });

  test('increments credentials found for expired status', () => {
    const result = computeUpdatedStats({ imagesChecked: 5, credentialsFound: 2 }, 'expired');
    expect(result.credentialsFound).toBe(3);
  });

  test('does not increment credentials found for none status', () => {
    const result = computeUpdatedStats({ imagesChecked: 5, credentialsFound: 2 }, 'none');
    expect(result.credentialsFound).toBe(2);
  });

  test('does not increment credentials found for error status', () => {
    const result = computeUpdatedStats({ imagesChecked: 5, credentialsFound: 2 }, 'error');
    expect(result.credentialsFound).toBe(2);
  });

  test('handles missing imagesChecked', () => {
    const result = computeUpdatedStats({ credentialsFound: 2 }, 'valid');
    expect(result.imagesChecked).toBe(1);
    expect(result.credentialsFound).toBe(3);
  });

  test('handles missing credentialsFound', () => {
    const result = computeUpdatedStats({ imagesChecked: 5 }, 'valid');
    expect(result.imagesChecked).toBe(6);
    expect(result.credentialsFound).toBe(1);
  });
});

describe('Stats integration scenarios', () => {
  test('typical user session: check 10 images, 2 have credentials', () => {
    let stats = { imagesChecked: 0, credentialsFound: 0 };

    // Simulate checking 10 images
    const statuses = ['none', 'none', 'valid', 'none', 'none', 'none', 'valid', 'none', 'none', 'none'];

    for (const status of statuses) {
      stats = computeUpdatedStats(stats, status);
    }

    expect(stats.imagesChecked).toBe(10);
    expect(stats.credentialsFound).toBe(2);
    expect(calculateSuccessRate(stats.imagesChecked, stats.credentialsFound)).toBe('20.0');
  });

  test('session with errors: errors count as checked but not found', () => {
    let stats = { imagesChecked: 0, credentialsFound: 0 };

    const statuses = ['valid', 'error', 'none', 'error', 'invalid'];

    for (const status of statuses) {
      stats = computeUpdatedStats(stats, status);
    }

    expect(stats.imagesChecked).toBe(5);
    expect(stats.credentialsFound).toBe(2); // valid + invalid
  });

  test('session with expired credentials', () => {
    let stats = { imagesChecked: 0, credentialsFound: 0 };

    const statuses = ['expired', 'none', 'expired'];

    for (const status of statuses) {
      stats = computeUpdatedStats(stats, status);
    }

    expect(stats.imagesChecked).toBe(3);
    expect(stats.credentialsFound).toBe(2); // expired counts as found
  });

  test('all images without credentials', () => {
    let stats = { imagesChecked: 0, credentialsFound: 0 };

    for (let i = 0; i < 50; i++) {
      stats = computeUpdatedStats(stats, 'none');
    }

    expect(stats.imagesChecked).toBe(50);
    expect(stats.credentialsFound).toBe(0);
    expect(calculateSuccessRate(stats.imagesChecked, stats.credentialsFound)).toBe('0.0');
  });
});
