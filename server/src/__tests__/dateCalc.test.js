const { calcMaturityDate, calcNextPremiumDate } = require('../lib/dateCalc');

describe('dateCalc', () => {
  test('calcMaturityDate adds policy term years', () => {
    expect(calcMaturityDate('2015-04-01', 20)).toBe('2035-04-01');
  });

  test('calcNextPremiumDate returns null for Single Premium', () => {
    expect(calcNextPremiumDate('2021-01-10', 'Single Premium')).toBeNull();
  });

  test('calcNextPremiumDate rolls forward to on/after today', () => {
    const result = calcNextPremiumDate('2019-07-15', 'Monthly');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(new Date(result).getTime()).toBeGreaterThanOrEqual(today.getTime());
  });
});
