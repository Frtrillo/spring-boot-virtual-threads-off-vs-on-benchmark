# Spring Boot vs NestJS: π Calculation Framework Comparison

## Test Setup
- **Spring Boot**: Java 24.0.2 with Virtual Threads
- **NestJS**: Node.js v22.15.0 with V8 engine
- **Algorithm**: Leibniz formula for π calculation
- **Framework overhead**: Full web framework stack included

## Results Summary

### 1 Million Iterations
| Framework | Time | Iterations/sec | Winner |
|-----------|------|----------------|--------|
| **NestJS** | **1.25ms** | **803,158,662** | **🥇 2.57x faster** |
| Spring Boot | 3.21ms | 311,858,449 | 🥈 |

### 10 Million Iterations  
| Framework | Time | Iterations/sec | Winner |
|-----------|------|----------------|--------|
| **NestJS** | **11.32ms** | **883,535,293** | **🥇 1.44x faster** |
| Spring Boot | 16.33ms | 612,401,148 | 🥈 |

### 100 Million Iterations
| Framework | Time | Iterations/sec | Winner |
|-----------|------|----------------|--------|
| **NestJS** | **114.4ms** | **874,090,215** | **🥇 1.50x faster** |
| Spring Boot | 171.43ms | 583,316,988 | 🥈 |

## Key Findings

### 🏆 **NestJS Dominates Across All Test Sizes**
- **Consistently 1.4-2.6x faster** than Spring Boot
- **Lower latency** at every iteration count
- **Higher throughput** in all scenarios

### 📊 **Performance Patterns**

#### **Small Workloads (1M iterations):**
- **NestJS advantage is largest**: 2.57x faster
- V8's quick JIT optimization shines
- Framework overhead is minimal

#### **Medium/Large Workloads (10M-100M iterations):**
- **NestJS maintains 1.4-1.5x advantage**
- Java's JIT eventually kicks in but can't catch up
- V8 continues to outperform HotSpot

### 🔍 **Technical Analysis**

#### **Why NestJS Wins:**
1. **V8 JIT Optimization**: Extremely aggressive mathematical optimization
2. **Single-threaded efficiency**: No thread coordination overhead
3. **Fast framework**: Express-based NestJS has minimal overhead
4. **Modern JavaScript engine**: Highly optimized number operations

#### **Why Spring Boot Struggles:**
1. **Framework overhead**: Spring Boot has significant startup and request processing overhead
2. **Virtual Thread coordination**: Still has some overhead despite being lightweight
3. **JIT warmup time**: Takes longer to reach optimal performance
4. **Object allocation**: More overhead in object creation and garbage collection

## Real-World Implications

### **For Pure Computational Web APIs:**
- **NestJS is the clear winner** for mathematical/computational endpoints
- **Lower latency and higher throughput** in production scenarios
- **Better resource utilization** for CPU-intensive tasks

### **When Spring Boot Still Makes Sense:**
- **Complex enterprise applications** with heavy business logic
- **Large team development** requiring strong typing and structure
- **Enterprise integrations** and mature ecosystem requirements
- **Long-term maintainability** over raw performance

## Conclusion

Even under **real web framework conditions**, **NestJS significantly outperforms Spring Boot** for computational workloads. This confirms that:

1. **JavaScript runtimes have become incredibly fast** for mathematical operations
2. **Framework overhead matters** - Spring Boot's enterprise features come with performance costs
3. **V8's JIT optimization** is more aggressive than Java's HotSpot for this type of workload

**The performance gap persists even with proper frameworks**, showing that the advantage isn't just about bare runtime performance but extends to real-world web applications.

---

*Test conducted on Apple M1, 8 cores, 16GB RAM with identical computational algorithms and proper framework implementations.*
