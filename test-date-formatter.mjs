#!/usr/bin/env node

// Test suite for date-formatter.js
// Run with: node test-date-formatter.mjs

import { formatDate, formatTime, formatDateTime, DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT } from './public/date-formatter.js';

// Test date: January 4, 2026 13:23:45 (local time, no timezone conversion)
// Using a date constructor without timezone to avoid conversion issues
const testDate = new Date(2026, 0, 4, 13, 23, 45).toISOString();

let passCount = 0;
let failCount = 0;

function runTest(description, expected, actual) {
  const passed = actual === expected;

  if (passed) {
    passCount++;
    console.log(`✓ ${description}`);
    console.log(`  Result: ${actual}`);
  } else {
    failCount++;
    console.error(`✗ ${description}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Got:      ${actual}`);
  }

  return passed;
}

console.log('\n=== Test Suite 1: Basic Date Formats ===\n');

runTest('ISO 8601 date', '2026-01-04',
  formatDate(testDate, 'YYYY-MM-DD'));

runTest('US numeric date', '1/4/2026',
  formatDate(testDate, 'M/D/YYYY'));

runTest('US date with month name', 'Jan 4, 2026',
  formatDate(testDate, 'MMM D, YYYY'));

runTest('European date', '04/01/2026',
  formatDate(testDate, 'DD/MM/YYYY'));

runTest('German date', '04.01.2026',
  formatDate(testDate, 'DD.MM.YYYY'));

runTest('Long month name', 'January 4, 2026',
  formatDate(testDate, 'MMMM D, YYYY'));

runTest('Two-digit year', '1/4/26',
  formatDate(testDate, 'M/D/YY'));

runTest('Zero-padded components', '01/04/2026',
  formatDate(testDate, 'MM/DD/YYYY'));

console.log('\n=== Test Suite 2: Weekday Formats ===\n');

runTest('Short weekday', 'Sun, Jan 4',
  formatDate(testDate, 'ddd, MMM D'));

runTest('Full weekday', 'Sunday, January 4, 2026',
  formatDate(testDate, 'dddd, MMMM D, YYYY'));

console.log('\n=== Test Suite 3: International Date Formats ===\n');

runTest('Japanese date', '2026年01月04日',
  formatDate(testDate, 'YYYY年MM月DD日'));

runTest('Chinese date (unpadded)', '2026年1月4日',
  formatDate(testDate, 'YYYY年M月D日'));

runTest('Korean date', '2026년 1월 4일',
  formatDate(testDate, 'YYYY년 M월 D일'));

console.log('\n=== Test Suite 4: Time Formats ===\n');

runTest('24-hour time', '13:23',
  formatTime(testDate, 'HH:mm'));

runTest('24-hour with seconds', '13:23:45',
  formatTime(testDate, 'HH:mm:ss'));

runTest('12-hour time with AM/PM', '1:23 PM',
  formatTime(testDate, 'h:mm a'));

runTest('12-hour with seconds', '1:23:45 PM',
  formatTime(testDate, 'h:mm:ss a'));

runTest('Zero-padded 12-hour', '01:23 PM',
  formatTime(testDate, 'hh:mm a'));

runTest('Compact 24-hour', '1323',
  formatTime(testDate, 'HHmm'));

console.log('\n=== Test Suite 5: Combined Date & Time ===\n');

runTest('ISO 8601 datetime', '2026-01-04 13:23:45',
  formatDateTime(testDate, 'YYYY-MM-DD', 'HH:mm:ss'));

runTest('US datetime', '1/4/2026 1:23 PM',
  formatDateTime(testDate, 'M/D/YYYY', 'h:mm a'));

runTest('European datetime', '04/01/2026 13:23',
  formatDateTime(testDate, 'DD/MM/YYYY', 'HH:mm'));

console.log('\n=== Test Suite 6: Error Handling ===\n');

runTest('Invalid format fallback', '2026-01-04',
  formatDate(testDate, 'invalid-format'));

runTest('Empty format fallback', '2026-01-04',
  formatDate(testDate, ''));

runTest('Null date string', '',
  formatDate(null, 'YYYY-MM-DD'));

runTest('Empty date string', '',
  formatDate('', 'YYYY-MM-DD'));

runTest('Invalid date string', '',
  formatDate('not-a-date', 'YYYY-MM-DD'));

console.log('\n=== Test Suite 7: Default Constants ===\n');

runTest('Default date format', 'YYYY-MM-DD',
  DEFAULT_DATE_FORMAT);

runTest('Default time format', 'HH:mm',
  DEFAULT_TIME_FORMAT);

console.log('\n=== Test Suite 8: Edge Cases ===\n');

// Test with midnight (local time)
const midnight = new Date(2026, 0, 4, 0, 0, 0).toISOString();
runTest('Midnight 24-hour', '00:00',
  formatTime(midnight, 'HH:mm'));

runTest('Midnight 12-hour', '12:00 AM',
  formatTime(midnight, 'h:mm a'));

// Test with noon (local time)
const noon = new Date(2026, 0, 4, 12, 0, 0).toISOString();
runTest('Noon 12-hour', '12:00 PM',
  formatTime(noon, 'h:mm a'));

// Test single-digit month and day (local time)
const singleDigit = new Date(2026, 2, 5, 13, 23, 45).toISOString();
runTest('Single-digit month/day unpadded', '3/5/2026',
  formatDate(singleDigit, 'M/D/YYYY'));

runTest('Single-digit month/day padded', '03/05/2026',
  formatDate(singleDigit, 'MM/DD/YYYY'));

// Summary
console.log('\n' + '='.repeat(60));
console.log('=== Test Summary ===');
console.log('='.repeat(60));
console.log(`Total:  ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.error(`\n✗ ${failCount} test(s) failed`);
  process.exit(1);
}
