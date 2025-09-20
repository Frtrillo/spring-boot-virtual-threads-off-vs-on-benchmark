package com.example.iotbench;

public class EnterpriseProcessingResult {
    private final String id;
    private final String status;
    private final int processedRecords;
    private final String validationScore;
    private final double riskAssessment;
    private final String complianceStatus;

    public EnterpriseProcessingResult(String id, String status, int processedRecords, 
                                    String validationScore, double riskAssessment, 
                                    String complianceStatus) {
        this.id = id;
        this.status = status;
        this.processedRecords = processedRecords;
        this.validationScore = validationScore;
        this.riskAssessment = riskAssessment;
        this.complianceStatus = complianceStatus;
    }

    public String getId() { return id; }
    public String getStatus() { return status; }
    public int getProcessedRecords() { return processedRecords; }
    public String getValidationScore() { return validationScore; }
    public double getRiskAssessment() { return riskAssessment; }
    public String getComplianceStatus() { return complianceStatus; }
}

