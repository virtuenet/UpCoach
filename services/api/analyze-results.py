#!/usr/bin/env python3
import re

# Read the CSV file
with open('test-results.csv', 'r') as f:
    lines = f.readlines()

results = []

for line in lines[1:]:  # Skip header
    if not line.strip():
        continue

    parts = line.strip().split(',')
    if len(parts) < 2:
        continue

    filename = parts[0]

    # Try to parse the data - handle malformed entries
    try:
        # Check if it's a properly formatted line
        if 'Tests:' in line:
            # Malformed entry - extract from the text
            passed_match = re.search(r'(\d+) passed', line)
            failed_match = re.search(r'(\d+) failed', line)
            total_match = re.search(r'(\d+) total', line)

            passed = int(passed_match.group(1)) if passed_match else 0
            failed = int(failed_match.group(1)) if failed_match else 0
            total = int(total_match.group(1)) if total_match else (passed + failed)
        else:
            # Properly formatted entry
            passed = int(parts[1])
            failed = int(parts[2])
            total = int(parts[3])

        if total == 0:
            continue

        # Calculate correct pass rate
        pass_rate = (passed / total) * 100

        results.append({
            'file': filename,
            'passed': passed,
            'failed': failed,
            'total': total,
            'pass_rate': pass_rate
        })
    except (ValueError, IndexError) as e:
        # Skip malformed lines
        continue

# Filter for files with >70% pass rate
high_pass = [r for r in results if r['pass_rate'] >= 70 and r['passed'] > 0]

# Sort by pass rate (desc), then by failures (asc)
high_pass.sort(key=lambda x: (-x['pass_rate'], x['failed']))

print("=" * 90)
print("TOP 10 QUICK WIN CANDIDATES (>70% Pass Rate)")
print("=" * 90)
print()

if high_pass:
    for i, r in enumerate(high_pass[:10], 1):
        print(f"{i}. {r['file']}")
        print(f"   {r['passed']}/{r['total']} passing ({r['pass_rate']:.1f}%, {r['failed']} failure{'s' if r['failed'] != 1 else ''})")
        print()
else:
    print("No files found with >70% pass rate")
    print()

# Calculate how many more tests we'd get
if high_pass:
    additional_passed = sum(r['failed'] for r in high_pass[:10])
    print(f"If all top 10 files were fixed: +{additional_passed} more passing tests")
    print(f"This would bring total from 515 to {515 + additional_passed} passing tests")
    print(f"New pass rate would be: {((515 + additional_passed) / 934) * 100:.1f}%")
    print()

print("\n" + "=" * 90)
print("ALL TEST FILES BY PASS RATE")
print("=" * 90)
print()

all_sorted = sorted(results, key=lambda x: (-x['pass_rate'], x['failed']))
for r in all_sorted:
    status = "✓" if r['pass_rate'] >= 70 else ("~" if r['pass_rate'] >= 50 else "✗")
    print(f"{status} {r['file']:<55} {r['passed']:3}/{r['total']:3} ({r['pass_rate']:5.1f}%) - {r['failed']} failing")

print()
print("=" * 90)
print(f"Total files analyzed: {len(results)}")
print(f"Files with >70% pass rate: {len(high_pass)}")
print(f"Files with >80% pass rate: {len([r for r in results if r['pass_rate'] >= 80])}")
print(f"Files with 100% pass rate: {len([r for r in results if r['pass_rate'] == 100])}")
print()
print(f"Current status: 515/934 passing (55.1%)")
print(f"Target: 562/934 passing (60%)")
print(f"Need: +47 more passing tests")
print()

# Show which combination of files would get us to 60%
print("=" * 90)
print("RECOMMENDED QUICK WIN STRATEGY")
print("=" * 90)
print()

# Sort by lowest number of failures first (easiest wins)
quick_wins = sorted([r for r in results if r['failed'] > 0 and r['failed'] <= 10 and r['pass_rate'] >= 50],
                    key=lambda x: x['failed'])

cumulative_fixes = 0
files_to_fix = []

for r in quick_wins:
    if cumulative_fixes < 47:
        cumulative_fixes += r['failed']
        files_to_fix.append(r)

if files_to_fix:
    print(f"Fix these {len(files_to_fix)} files to reach 60% pass rate:")
    print()
    for i, r in enumerate(files_to_fix, 1):
        print(f"{i}. {r['file']}")
        print(f"   {r['passed']}/{r['total']} passing ({r['pass_rate']:.1f}%) - Fix {r['failed']} test{'s' if r['failed'] != 1 else ''}")
        print()

    total_fixes = sum(r['failed'] for r in files_to_fix)
    new_total = 515 + total_fixes
    new_rate = (new_total / 934) * 100
    print(f"Total tests to fix: {total_fixes}")
    print(f"New total passing: {new_total}/934 ({new_rate:.1f}%)")
