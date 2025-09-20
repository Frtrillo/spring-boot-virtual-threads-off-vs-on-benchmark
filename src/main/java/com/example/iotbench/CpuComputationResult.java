package com.example.iotbench;

public class CpuComputationResult {
    private final String computationId;
    private final double monteCarloResult;
    private final double matrixDeterminant;
    private final int primeCount;
    private final long fibonacciSum;
    private final int parallelTasksCompleted;

    public CpuComputationResult(String computationId, double monteCarloResult, 
                               double matrixDeterminant, int primeCount, 
                               long fibonacciSum, int parallelTasksCompleted) {
        this.computationId = computationId;
        this.monteCarloResult = monteCarloResult;
        this.matrixDeterminant = matrixDeterminant;
        this.primeCount = primeCount;
        this.fibonacciSum = fibonacciSum;
        this.parallelTasksCompleted = parallelTasksCompleted;
    }

    public String getComputationId() { return computationId; }
    public double getMonteCarloResult() { return monteCarloResult; }
    public double getMatrixDeterminant() { return matrixDeterminant; }
    public int getPrimeCount() { return primeCount; }
    public long getFibonacciSum() { return fibonacciSum; }
    public int getParallelTasksCompleted() { return parallelTasksCompleted; }
}
