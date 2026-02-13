// ============================================================================
// Azure Monitor Alerts for Resilience Monitoring
// ============================================================================
// This module creates alerts that trigger during performance degradation,
// useful for detecting issues during load tests and chaos experiments.
// ============================================================================

@description('Location for resources')
param location string = resourceGroup().location

@description('Resource ID of Application Insights')
param appInsightsResourceId string

@description('Resource ID of App Service')
param appServiceResourceId string

@description('Action Group ID for notifications')
param actionGroupId string

@description('Tags for resources')
param tags object = {
  purpose: 'resilience-monitoring'
  application: 'contoso-university'
}

// ============================================================================
// Alert: High Response Time
// ============================================================================
resource highResponseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-high-response-time'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when p95 response time exceeds 2 seconds'
    severity: 2 // Warning
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighP95ResponseTime'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 2000 // 2 seconds
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ============================================================================
// Alert: High Error Rate
// ============================================================================
resource highErrorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-high-error-rate'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when error rate exceeds 1%'
    severity: 1 // Error
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighErrorRate'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 10 // More than 10 failed requests per 5 min
          timeAggregation: 'Total'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ============================================================================
// Alert: High CPU Usage
// ============================================================================
resource highCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-high-cpu'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when App Service CPU exceeds 80%'
    severity: 2 // Warning
    enabled: true
    scopes: [
      appServiceResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCPU'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'CpuPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ============================================================================
// Alert: Availability Degradation
// ============================================================================
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-availability-degradation'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when availability drops below 99%'
    severity: 1 // Error
    enabled: true
    scopes: [
      appInsightsResourceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'LowAvailability'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'availabilityResults/availabilityPercentage'
          metricNamespace: 'microsoft.insights/components'
          operator: 'LessThan'
          threshold: 99
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
        webHookProperties: {}
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================
output alerts array = [
  highResponseTimeAlert.id
  highErrorRateAlert.id
  highCpuAlert.id
  availabilityAlert.id
]
