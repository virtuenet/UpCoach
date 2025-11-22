#!/usr/bin/env python3
import re
import sys

# Read the test output file
with open('full-test-output.txt', 'r') as f:
    content = f.read()

# Split into individual test suite sections
# Pattern: PASS/FAIL followed by filename, then tests until next PASS/FAIL
results = []
current_file = None

lines = content.split('\n')
for i, line in enumerate(lines):
    # Match PASS/FAIL lines with test file paths
    if line.startswith('PASS ') or line.startswith('FAIL '):
        current_file = line.split(' ', 1)[1].strip()
        # Only track files in __tests__ directory
        if 'src/__tests__/' in current_file:
            current_file = current_file.replace('src/__tests__/', '')
        else:
            current_file = None

    # Match test count lines like "Tests:       3 passed, 3 total"
    if current_file and line.strip().startswith('Tests:'):
        # Extract numbers
        passed_match = re.search(r'(\d+) passed', line)
        failed_match = re.search(r'(\d+) failed', line)
        total_match = re.search(r'(\d+) total', line)

        if total_match:
            total = int(total_match.group(1))
            passed = int(passed_match.group(1)) if passed_match else 0
            failed = int(failed_match.group(1)) if failed_match else 0

            if total > 0:
                pass_rate = (passed / total) * 100
                results.append({
                    'file': current_file,
                    'passed': passed,
                    'failed': failed,
                    'total': total,
                    'pass_rate': pass_rate
                })
            current_file = None

# Remove duplicates (keep first occurrence of each file)
seen = set()
unique_results = []
for result in results:
    if result['file'] not in seen:
        seen.add(result['file'])
        unique_results.append(result)

# Filter for files with >70% pass rate and at least some passing tests
high_pass_rate_files = [r for r in unique_results if r['pass_rate'] >= 70 and r['passed'] > 0]

# Sort by pass rate (descending), then by number of failures (ascending)
high_pass_rate_files.sort(key=lambda x: (-x['pass_rate'], x['failed']))

print("Top Test Files with >70% Pass Rate (Quick Win Candidates)")
print("=" * 80)
print()

for i, result in enumerate(high_pass_rate_files[:15], 1):
    print(f"{i}. {result['file']}")
    print(f"   {result['passed']}/{result['total']} passing ({result['pass_rate']:.1f}%, {result['failed']} failure{'s' if result['failed'] != 1 else ''})")
    print()

print("\n" + "=" * 80)
print(f"Total files with >70% pass rate: {len(high_pass_rate_files)}")
print()

# Also show all results sorted by pass rate
print("\nAll Test Files by Pass Rate:")
print("=" * 80)
all_sorted = sorted(unique_results, key=lambda x: (-x['pass_rate'], x['failed']))
for result in all_sorted:
    status = "✓" if result['pass_rate'] >= 70 else "✗"
    print(f"{status} {result['file']:<60} {result['passed']:3}/{result['total']:3} ({result['pass_rate']:5.1f}%) - {result['failed']} failing")
