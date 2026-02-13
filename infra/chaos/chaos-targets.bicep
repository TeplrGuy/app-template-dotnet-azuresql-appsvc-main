// ============================================================================
// Azure Chaos Studio - Chaos Targets Setup
// ============================================================================
// This module enables Chaos Studio targets on Azure resources to allow
// fault injection experiments.
//
// Run this BEFORE creating experiments to ensure targets are registered.
//
// Supported Service-Direct Faults:
// - SQL Database: Failover
// - App Service: Stop
// ============================================================================

@description('Resource ID of the Azure SQL Database')
param sqlDatabaseResourceId string

@description('Resource ID of the App Service')
param appServiceResourceId string

// ============================================================================
// Extract resource names from resource IDs
// ============================================================================
var sqlServerName = split(sqlDatabaseResourceId, '/')[8]
var sqlDatabaseName = split(sqlDatabaseResourceId, '/')[10]
var appServiceName = split(appServiceResourceId, '/')[8]

// ============================================================================
// Reference existing resources
// ============================================================================
resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' existing = {
  name: '${sqlServerName}/${sqlDatabaseName}'
}

resource appService 'Microsoft.Web/sites@2022-09-01' existing = {
  name: appServiceName
}

// ============================================================================
// Enable Chaos Target on SQL Database
// ============================================================================
resource sqlChaosTarget 'Microsoft.Chaos/targets@2023-11-01' = {
  name: 'Microsoft-AzureSQLDatabase'
  scope: sqlDatabase
  properties: {}
}

// ============================================================================
// Enable Capabilities on SQL Database Target
// Service-direct fault: Failover (triggers a database failover)
// ============================================================================
resource sqlFailoverCapability 'Microsoft.Chaos/targets/capabilities@2023-11-01' = {
  parent: sqlChaosTarget
  name: 'Failover-1.0'
}

// ============================================================================
// Enable Chaos Target on App Service
// ============================================================================
resource appServiceChaosTarget 'Microsoft.Chaos/targets@2023-11-01' = {
  name: 'Microsoft-AppService'
  scope: appService
  properties: {}
}

// ============================================================================
// Enable Capabilities on App Service Target
// Service-direct fault: Stop (stops the app service)
// ============================================================================
resource appServiceStopCapability 'Microsoft.Chaos/targets/capabilities@2023-11-01' = {
  parent: appServiceChaosTarget
  name: 'Stop-1.0'
}

// ============================================================================
// Outputs
// ============================================================================
output sqlChaosTargetId string = sqlChaosTarget.id
output appServiceChaosTargetId string = appServiceChaosTarget.id
