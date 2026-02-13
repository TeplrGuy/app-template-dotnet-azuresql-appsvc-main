// ============================================================================
// Azure Chaos Studio - SQL Database Failover Experiment
// ============================================================================
// This experiment triggers a failover on the Azure SQL Database to test
// application resilience to database connectivity disruptions.
//
// Note: This uses the service-direct Failover fault which is supported
// without installing the Chaos Agent.
//
// Prerequisites:
// - Chaos Studio target enabled on SQL Database
// - Managed Identity with appropriate permissions
// ============================================================================

@description('The name of the chaos experiment')
param experimentName string = 'sql-latency-experiment'

@description('Location for the chaos experiment')
param location string = resourceGroup().location

@description('Resource ID of the target Azure SQL Database')
param sqlDatabaseResourceId string

@description('Resource ID of the App Service to test')
param appServiceResourceId string

@description('Duration is not used for failover but kept for compatibility')
param duration string = 'PT3M'

@description('Latency parameter kept for compatibility (not used in failover)')
param latencyMs int = 500

@description('Tags for resources')
param tags object = {
  purpose: 'chaos-engineering'
  application: 'contoso-university'
}

// ============================================================================
// Chaos Experiment - SQL Failover
// ============================================================================
resource chaosExperiment 'Microsoft.Chaos/experiments@2023-11-01' = {
  name: experimentName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    selectors: [
      {
        type: 'List'
        id: 'selector-sql'
        targets: [
          {
            type: 'ChaosTarget'
            id: '${sqlDatabaseResourceId}/providers/Microsoft.Chaos/targets/Microsoft-AzureSQLDatabase'
          }
        ]
      }
    ]
    steps: [
      {
        name: 'Step 1 - SQL Database Failover'
        branches: [
          {
            name: 'Branch 1 - Trigger Failover'
            actions: [
              {
                type: 'discrete'
                name: 'urn:csci:microsoft:azureSqlDatabase:failover/1.0'
                selectorId: 'selector-sql'
                parameters: []
              }
            ]
          }
        ]
      }
    ]
  }
}

// ============================================================================
// Role Assignments for Chaos Experiment
// ============================================================================
// The experiment needs Contributor permissions to inject faults
// Requires the deploying identity to have Owner or User Access Administrator role

resource sqlRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(chaosExperiment.id, sqlDatabaseResourceId, 'sql-chaos')
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      'b24988ac-6180-42a0-ab88-20f7382dd24c'
    ) // Contributor
    principalId: chaosExperiment.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================================
// Outputs
// ============================================================================
output experimentId string = chaosExperiment.id
output experimentName string = chaosExperiment.name
output principalId string = chaosExperiment.identity.principalId
