import { isValidZoneId, isValidUserCount, isValidTickInterval, isValidVendorType, isValidSimulationEvent, sanitizeChatMessage } from '../src/utils/validators';

describe('Input Validators — Security Layer', () => {
  describe('isValidZoneId', () => {
    test('accepts valid zone IDs', () => {
      expect(isValidZoneId('stand-north')).toBe(true);
      expect(isValidZoneId('food-north')).toBe(true);
      expect(isValidZoneId('gate-a')).toBe(true);
    });

    test('rejects invalid zone IDs', () => {
      expect(isValidZoneId('nonexistent')).toBe(false);
      expect(isValidZoneId('')).toBe(false);
      expect(isValidZoneId(123)).toBe(false);
      expect(isValidZoneId(null)).toBe(false);
      expect(isValidZoneId(undefined)).toBe(false);
    });
  });

  describe('isValidUserCount', () => {
    test('accepts valid counts', () => {
      expect(isValidUserCount(1)).toBe(true);
      expect(isValidUserCount(500)).toBe(true);
      expect(isValidUserCount(5000)).toBe(true);
    });

    test('rejects out of range', () => {
      expect(isValidUserCount(0)).toBe(false);
      expect(isValidUserCount(-1)).toBe(false);
      expect(isValidUserCount(5001)).toBe(false);
      expect(isValidUserCount(999999)).toBe(false);
    });

    test('rejects non-numbers', () => {
      expect(isValidUserCount('abc')).toBe(false);
      expect(isValidUserCount(null)).toBe(false);
      expect(isValidUserCount(NaN)).toBe(false);
    });
  });

  describe('isValidTickInterval', () => {
    test('accepts valid intervals', () => {
      expect(isValidTickInterval(500)).toBe(true);
      expect(isValidTickInterval(2000)).toBe(true);
      expect(isValidTickInterval(10000)).toBe(true);
    });

    test('rejects out of range', () => {
      expect(isValidTickInterval(499)).toBe(false);
      expect(isValidTickInterval(10001)).toBe(false);
      expect(isValidTickInterval(0)).toBe(false);
    });
  });

  describe('isValidVendorType', () => {
    test('accepts valid vendor types', () => {
      expect(isValidVendorType('FOOD')).toBe(true);
      expect(isValidVendorType('BEVERAGE')).toBe(true);
      expect(isValidVendorType('MERCHANDISE')).toBe(true);
      expect(isValidVendorType('SNACK')).toBe(true);
    });

    test('rejects invalid types', () => {
      expect(isValidVendorType('INVALID')).toBe(false);
      expect(isValidVendorType('')).toBe(false);
      expect(isValidVendorType(123)).toBe(false);
    });
  });

  describe('isValidSimulationEvent', () => {
    test('accepts valid events', () => {
      expect(isValidSimulationEvent('halftime')).toBe(true);
      expect(isValidSimulationEvent('endgame')).toBe(true);
      expect(isValidSimulationEvent('emergency')).toBe(true);
      expect(isValidSimulationEvent('reset')).toBe(true);
    });

    test('rejects invalid events', () => {
      expect(isValidSimulationEvent('invalid')).toBe(false);
      expect(isValidSimulationEvent('')).toBe(false);
    });
  });

  describe('sanitizeChatMessage', () => {
    test('accepts valid messages', () => {
      const result = sanitizeChatMessage('Where is the food court?');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Where is the food court?');
    });

    test('trims whitespace', () => {
      const result = sanitizeChatMessage('  hello  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('hello');
    });

    test('rejects empty messages', () => {
      expect(sanitizeChatMessage('').valid).toBe(false);
      expect(sanitizeChatMessage('   ').valid).toBe(false);
    });

    test('rejects non-strings', () => {
      expect(sanitizeChatMessage(123).valid).toBe(false);
      expect(sanitizeChatMessage(null).valid).toBe(false);
    });

    test('rejects messages over 500 chars', () => {
      const long = 'x'.repeat(501);
      expect(sanitizeChatMessage(long).valid).toBe(false);
    });
  });
});
