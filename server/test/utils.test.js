const { mergeTasks, compareUpdatedAt, toBoolean } = require('../utils');

describe('Task utils', () => {
  describe('toBoolean', () => {
    it('should convert various values to boolean', () => {
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(undefined)).toBe(false);
      expect(toBoolean(null)).toBe(false);
    });
  });

  describe('compareUpdatedAt', () => {
    it('should compare ISO dates correctly', () => {
      expect(compareUpdatedAt('2024-01-01T00:00:00Z', '2023-01-01T00:00:00Z')).toBe(true);
      expect(compareUpdatedAt('2023-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(false);
      expect(compareUpdatedAt(undefined, '2024-01-01T00:00:00Z')).toBe(true);
      expect(compareUpdatedAt('2024-01-01T00:00:00Z', undefined)).toBe(true);
    });
  });

  describe('mergeTasks', () => {
    it('should merge tasks by taskId and updatedAt', () => {
      const oldTasks = [
        { taskId: 1, isCompleted: false, updatedAt: '2023-01-01T00:00:00Z' },
        { taskId: 2, isCompleted: false, updatedAt: '2023-01-01T00:00:00Z' }
      ];
      const newTasks = [
        { taskId: 1, isCompleted: true, updatedAt: '2024-01-01T00:00:00Z' },
        { taskId: 3, isCompleted: true, updatedAt: '2024-01-01T00:00:00Z' }
      ];
      const merged = mergeTasks(oldTasks, newTasks);
      expect(merged).toEqual([
        { taskId: 1, isCompleted: true, updatedAt: '2024-01-01T00:00:00Z' },
        { taskId: 2, isCompleted: false, updatedAt: '2023-01-01T00:00:00Z' },
        { taskId: 3, isCompleted: true, updatedAt: '2024-01-01T00:00:00Z' }
      ]);
    });
  });
}); 