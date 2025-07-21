# Rate Verification Plan

## Observed API Behavior (From Logs)
✅ **CONFIRMED ACCURATE**: 1 lb (0.45kg) to Zone 8 → $4.84 (matches rate card)

## Manual Testing Plan

### Test These Specific Scenarios in Rate Calculator:

#### Zone 1 Tests (Nearby States)
- **8 oz to 10001 (NY)**: Expected Zone 1
- **1 lb to 10001 (NY)**: Expected Zone 1  
- **1.5 lb to 10001 (NY)**: Expected Zone 1

#### Zone 3 Tests (Southeast)
- **8 oz to 33101 (Miami)**: Expected Zone 3
- **1 lb to 33101 (Miami)**: Expected Zone 3
- **1.5 lb to 33101 (Miami)**: Expected Zone 3

#### Zone 5 Tests (Midwest)
- **8 oz to 60601 (Chicago)**: Expected Zone 5  
- **1 lb to 60601 (Chicago)**: Expected Zone 5
- **1.5 lb to 60601 (Chicago)**: Expected Zone 5

#### Zone 8 Tests (West Coast - Known Working)
- **8 oz to 90210 (Beverly Hills)**: Expected Zone 8
- **1 lb to 90210 (Beverly Hills)**: Expected Zone 8, Should be $4.84 ✅
- **1.5 lb to 90210 (Beverly Hills)**: Expected Zone 8
- **2 lb to 90210 (Beverly Hills)**: Expected Zone 8
- **3 lb to 90210 (Beverly Hills)**: Expected Zone 8

#### Additional Zone 8 Locations
- **1 lb to 97201 (Portland)**: Expected Zone 8
- **1 lb to 85001 (Phoenix)**: Expected Zone 8
- **1 lb to 94102 (San Francisco)**: Expected Zone 8

## Rate Progression Analysis

### Expected Pattern for Zone 8 (based on rate card):
- 0.5 kg (1.1 lb): $4.84
- 1.0 kg (2.2 lb): [Check against your rate card]
- 1.5 kg (3.3 lb): [Check against your rate card]

## Testing Instructions

1. **Login to Rate Calculator**: Navigate to /rate-calculator
2. **Use Standard Settings**:
   - Pickup ZIP: 11430 (JFK hub)
   - Dimensions: 10" x 10" x 5" (standard)
3. **Test Each Scenario**: Record results in format:
   ```
   Weight | Delivery ZIP | Expected Zone | Actual Rate | Actual Zone | Match?
   8oz    | 90210       | Zone 8        | $X.XX       | Zone X      | ✅/❌
   ```

## Questions to Verify:

1. **Zone Accuracy**: Do the zones returned by API match expected geographic zones?
2. **Rate Progression**: Do rates increase logically with weight within same zone?
3. **Zone Differences**: Are Zone 8 rates higher than Zone 1 rates for same weight?
4. **Specific Rates**: Do actual rates match your rate card values?

## Known Issues to Watch For:

- ❌ Some ZIP codes not covered (will show coverage error)
- ✅ Rate calculation working with actual Jiayou API
- ✅ Zone detection working (confirmed Zone 8 detection)
- ✅ String to number conversion fixed

## Next Steps After Testing:

Please run these tests and let me know:
1. Which rates don't match your rate card
2. Which zones are incorrectly assigned
3. Any patterns you notice in the discrepancies

This will help me identify if the issue is in the API integration, rate calculation logic, or zone mapping.