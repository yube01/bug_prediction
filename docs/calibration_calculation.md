# How Calibration is Calculated (Absolute Simplest Explanation)

Probability calibration is calculated using four simple steps:

### 1. Sort the Commits
Sort all historical commits by their raw predicted risk scores, from lowest to highest.

### 2. Group into Buckets
Group commits with similar raw scores into small buckets.

### 3. Calculate Actual Bug Rates
For each bucket, count the actual percentage of commits that contained a bug. 
* *Example:* If a bucket has 100 commits and 38 of them actually had bugs, the true rate for that bucket is **38%**.

### 4. Group to Prevent Violations (The Only Rule)
If a lower-risk bucket happens to have a higher actual bug rate than a higher-risk bucket next to it, we **merge them together** and take their average. This guarantees that a higher raw score always translates to a higher or equal calibrated probability.
