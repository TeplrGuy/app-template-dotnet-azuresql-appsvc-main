// =============================================================================
// SRE Agent Role Assignments
// =============================================================================
// Grants the SRE Agent identity permissions on monitored resources.
// Accounts for both frontend (Web App) and backend (API App) separately.
//
// Access levels:
//   High: Log Analytics Reader + Reader + Contributor + App Insights Contributor
//   Low:  Log Analytics Reader + Reader
// =============================================================================

// -----------------------------------------------------------------------------
// Parameters
// -----------------------------------------------------------------------------

@description('Principal ID of the user-assigned managed identity')
param userAssignedIdentityPrincipalId string

@description('Principal ID of the system-assigned managed identity (from the SRE Agent)')
param systemAssignedIdentityPrincipalId string = ''

@description('Access level: High grants Contributor + Reader, Low grants Reader only')
@allowed(['High', 'Low'])
param accessLevel string = 'High'

@description('Resource ID of the Web App (frontend)')
param webAppId string

@description('Resource ID of the API App (backend)')
param apiAppId string

@description('Resource ID of the Application Insights instance')
param appInsightsId string

@description('Resource ID of the Log Analytics workspace')
param logAnalyticsId string

// -----------------------------------------------------------------------------
// Role Definition IDs
// -----------------------------------------------------------------------------

// Built-in Azure RBAC roles
var readerRoleId = 'acdd72a7-3385-48ef-bd42-f606fba81ae7'
var contributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'
var logAnalyticsReaderRoleId = '92aaf0da-9dab-42b6-94a3-d43ce8d16293'
var appInsightsContributorRoleId = 'ae349356-3a1b-4a5e-921d-050484c6347e'

// =============================================================================
// User-Assigned Identity — Reader on Frontend (Web App)
// =============================================================================
resource webAppReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(webAppId, userAssignedIdentityPrincipalId, readerRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', readerRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// User-Assigned Identity — Reader on Backend (API App)
// =============================================================================
resource apiAppReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(apiAppId, userAssignedIdentityPrincipalId, readerRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', readerRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// User-Assigned Identity — Reader on Application Insights
// =============================================================================
resource appInsightsReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(appInsightsId, userAssignedIdentityPrincipalId, readerRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', readerRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// User-Assigned Identity — Log Analytics Reader
// =============================================================================
resource logAnalyticsReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(logAnalyticsId, userAssignedIdentityPrincipalId, logAnalyticsReaderRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', logAnalyticsReaderRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// User-Assigned Identity — App Insights Component Contributor (High access only)
// =============================================================================
resource appInsightsContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (accessLevel == 'High') {
  name: guid(appInsightsId, userAssignedIdentityPrincipalId, appInsightsContributorRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', appInsightsContributorRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// User-Assigned Identity — Contributor on Frontend (High access only)
// =============================================================================
resource webAppContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (accessLevel == 'High') {
  name: guid(webAppId, userAssignedIdentityPrincipalId, contributorRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// User-Assigned Identity — Contributor on Backend (High access only)
// =============================================================================
resource apiAppContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (accessLevel == 'High') {
  name: guid(apiAppId, userAssignedIdentityPrincipalId, contributorRoleId)
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
    principalId: userAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// System-Assigned Identity — Reader on App Insights (for telemetry queries)
// =============================================================================
resource sysAppInsightsReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(systemAssignedIdentityPrincipalId)) {
  name: guid(appInsightsId, systemAssignedIdentityPrincipalId, readerRoleId, 'system')
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', readerRoleId)
    principalId: systemAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// System-Assigned Identity — App Insights Component Contributor (for telemetry)
// =============================================================================
resource sysAppInsightsContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(systemAssignedIdentityPrincipalId)) {
  name: guid(appInsightsId, systemAssignedIdentityPrincipalId, appInsightsContributorRoleId, 'system')
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', appInsightsContributorRoleId)
    principalId: systemAssignedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}
