package com.example.iotbench;

public class EnterpriseProcessingResult {
    private final String eventId;
    private final int processedRecords;
    private final String validationResult;
    private final double riskScore;
    private final String complianceStatus;

    public EnterpriseProcessingResult(String eventId, int processedRecords, 
                                    String validationResult, double riskScore, 
                                    String complianceStatus) {
        this.eventId = eventId;
        this.processedRecords = processedRecords;
        this.validationResult = validationResult;
        this.riskScore = riskScore;
        this.complianceStatus = complianceStatus;
    }

    public String getEventId() { return eventId; }
    public int getProcessedRecords() { return processedRecords; }
    public String getValidationResult() { return validationResult; }
    public double getRiskScore() { return riskScore; }
    public String getComplianceStatus() { return complianceStatus; }
}