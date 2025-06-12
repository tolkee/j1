import { recurringTransactionUtils } from '../useRecurringTransactions';

describe('recurringTransactionUtils', () => {
  describe('calculateNextExecution', () => {
    it('should calculate next daily execution correctly', () => {
      const currentDate = new Date('2024-01-15T10:00:00Z');
      const nextDate = recurringTransactionUtils.calculateNextExecution(currentDate, 'daily');
      
      expect(nextDate.getDate()).toBe(16);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getFullYear()).toBe(2024);
    });

    it('should calculate next weekly execution correctly', () => {
      const currentDate = new Date('2024-01-15T10:00:00Z');
      const nextDate = recurringTransactionUtils.calculateNextExecution(currentDate, 'weekly');
      
      expect(nextDate.getDate()).toBe(22);
      expect(nextDate.getMonth()).toBe(0); // January
      expect(nextDate.getFullYear()).toBe(2024);
    });

    it('should calculate next monthly execution correctly', () => {
      const currentDate = new Date('2024-01-15T10:00:00Z');
      const nextDate = recurringTransactionUtils.calculateNextExecution(currentDate, 'monthly');
      
      expect(nextDate.getDate()).toBe(15);
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getFullYear()).toBe(2024);
    });
  });

  describe('formatFrequency', () => {
    it('should format frequencies correctly', () => {
      expect(recurringTransactionUtils.formatFrequency('daily')).toBe('Daily');
      expect(recurringTransactionUtils.formatFrequency('weekly')).toBe('Weekly');
      expect(recurringTransactionUtils.formatFrequency('monthly')).toBe('Monthly');
    });
  });

  describe('formatNextExecution', () => {
    it('should format next execution times correctly', () => {
      expect(recurringTransactionUtils.formatNextExecution(-1)).toBe('Overdue');
      expect(recurringTransactionUtils.formatNextExecution(0)).toBe('Today');
      expect(recurringTransactionUtils.formatNextExecution(1)).toBe('Tomorrow');
      expect(recurringTransactionUtils.formatNextExecution(3)).toBe('In 3 days');
      expect(recurringTransactionUtils.formatNextExecution(10)).toBe('In 1 weeks');
      expect(recurringTransactionUtils.formatNextExecution(45)).toBe('In 2 months');
    });
  });

  describe('getSuggestedDates', () => {
    it('should return suggested dates for daily frequency', () => {
      const suggestions = recurringTransactionUtils.getSuggestedDates('daily');
      
      expect(suggestions.nextExecution).toBeInstanceOf(Date);
      expect(suggestions.suggestedEnd).toBeInstanceOf(Date);
      expect(suggestions.nextExecution.getTime()).toBeGreaterThan(Date.now());
      expect(suggestions.suggestedEnd.getTime()).toBeGreaterThan(suggestions.nextExecution.getTime());
    });

    it('should return suggested dates for weekly frequency', () => {
      const suggestions = recurringTransactionUtils.getSuggestedDates('weekly');
      
      expect(suggestions.nextExecution).toBeInstanceOf(Date);
      expect(suggestions.suggestedEnd).toBeInstanceOf(Date);
      expect(suggestions.nextExecution.getTime()).toBeGreaterThan(Date.now());
      expect(suggestions.suggestedEnd.getTime()).toBeGreaterThan(suggestions.nextExecution.getTime());
    });

    it('should return suggested dates for monthly frequency', () => {
      const suggestions = recurringTransactionUtils.getSuggestedDates('monthly');
      
      expect(suggestions.nextExecution).toBeInstanceOf(Date);
      expect(suggestions.suggestedEnd).toBeInstanceOf(Date);
      expect(suggestions.nextExecution.getTime()).toBeGreaterThan(Date.now());
      expect(suggestions.suggestedEnd.getTime()).toBeGreaterThan(suggestions.nextExecution.getTime());
    });
  });
});