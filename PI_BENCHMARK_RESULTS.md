# Pi Calculation Benchmark Results

This document contains the performance comparison results for Pi calculation across different runtimes.

## 100 Million Iterations

| Rank | Runtime | Time | Rate (iterations/sec) | Performance vs Java |
|------|---------|------|----------------------|-------------------|
| 🥇 | Bun | 96.66ms | 1,034,587,555 | 1.82x faster |
| 🥈 | Node.js | 111.15ms | 899,676,344 | 1.58x faster |
| 🥉 | Java | 175.71ms | 569,132,664 | Baseline |

## 1 Billion Iterations (Extended Precision)

| Rank | Runtime | Time | Rate (iterations/sec) | Performance vs Java |
|------|---------|------|----------------------|-------------------|
| 🥇 | Bun | 958.33ms | 1,043,486,926 | 1.03x faster |
| 🥈 | Java | 984.05ms | 1,016,203,578 | Baseline |
| 🥉 | Node.js | 1788.66ms | 559,079,217 | 0.55x slower |

## Key Observations

- **100M iterations**: Bun leads with 1.82x performance improvement over Java, while Node.js shows 1.58x improvement
- **1B iterations**: Bun maintains a slight edge over Java (1.03x faster), but Node.js performance degrades significantly to 0.55x of Java's performance
- **Performance scaling**: Bun shows the most consistent performance across different iteration counts
- **Java consistency**: Java maintains stable performance ratios across both test scenarios
