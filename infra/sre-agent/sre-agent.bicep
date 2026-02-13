// =============================================================================
// Azure SRE Agent Module (Preview)
// =============================================================================
// Deploys an Azure SRE Agent following the official microsoft/sre-agent Bicep
// pattern with UserAssigned + SystemAssigned managed identity,
// knowledgeGraphConfiguration, actionConfiguration, and logConfiguration.
//
// References:
//   - https://github.com/microsoft/sre-agent/tree/main/samples/bicep-deployment
//   - https://learn.microsoft.com/en-us/azure/sre-agent/overview
//
// The agent monitors both the frontend (Web App) and backend (API App) of the
// Contoso University application and integrates with App Insights for
// telemetry analysis and GitHub for code-level remediation.
// =============================================================================

// -----------------------------------------------------------------------------
// Parameters
// -----------------------------------------------------------------------------

@description('Name of the SRE Agent resource')
param agentName string

@description('Location for the SRE Agent (limited preview regions: swedencentral, eastus2, australiaeast, uksouth)')
@allowed(['swedencentral', 'eastus2', 'australiaeast', 'uksouth'])
param location string = 'eastus2'

@description('Access level for the SRE Agent: High = Reader + Contributor, Low = Reader only')
@allowed(['High', 'Low'])
param accessLevel string = 'High'

@description('Agent mode: Review = human approval, Autonomous = auto-remediate, ReadOnly = observe only')
@allowed(['Review', 'Autonomous', 'ReadOnly'])
param agentMode string = 'Review'

@description('Resource ID of the Application Insights instance')
param appInsightsId string

@description('Application Insights App ID (from properties.AppId)')
param appInsightsAppId string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Resource ID of the Log Analytics workspace')
param logAnalyticsWorkspaceId string

@description('Resource ID of the Web App (frontend)')
param webAppId string

@description('Resource ID of the API App (backend)')
param apiAppId string

@description('GitHub repository URL for code integration (e.g., https://github.com/owner/repo)')
param githubRepoUrl string = ''

@description('Optional: Resource ID of an existing user-assigned managed identity. If empty, a new one is created.')
param existingManagedIdentityId string = ''

@description('Deploy RBAC role assignments (requires Owner or User Access Administrator role)')
param deployRbacAssignments bool = false

@description('Tags to apply to the SRE Agent resources')
param tags object = {}

// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

var shouldCreateManagedIdentity = empty(existingManagedIdentityId)
var uniqueSuffix = uniqueString(resourceGroup().id, agentName)
var userAssignedIdentityName = '${agentName}-identity-${uniqueSuffix}'

// -----------------------------------------------------------------------------
// User-Assigned Managed Identity
// -----------------------------------------------------------------------------
// The SRE Agent requires a user-assigned identity for knowledge graph access
// and action execution across monitored resources.

#disable-next-line BCP073
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = if (shouldCreateManagedIdentity) {
  name: userAssignedIdentityName
  location: location
  tags: tags
}

// Reference existing identity when provided
resource existingManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = if (!shouldCreateManagedIdentity) {
  name: last(split(existingManagedIdentityId, '/'))
}

// Resolve the identity resource ID to use
var managedIdentityId = shouldCreateManagedIdentity ? userAssignedIdentity.id : existingManagedIdentityId

// -----------------------------------------------------------------------------
// SRE Agent Resource
// -----------------------------------------------------------------------------
// Deploys the SRE Agent with dual identity (SystemAssigned + UserAssigned),
// knowledge graph configuration, action configuration, and log configuration
// pointing to the Application Insights instance.

#disable-next-line BCP081
resource sreAgent 'Microsoft.App/agents@2025-05-01-preview' = {
  name: agentName
  location: location
  tags: union(tags, {
    purpose: 'sre-automation'
    'frontend-app': last(split(webAppId, '/'))
    'backend-app': last(split(apiAppId, '/'))
    'app-insights': last(split(appInsightsId, '/'))
    'log-analytics': last(split(logAnalyticsWorkspaceId, '/'))
    'github-repo': !empty(githubRepoUrl) ? githubRepoUrl : 'not-configured'
  })
  identity: {
    type: 'SystemAssigned, UserAssigned'
    userAssignedIdentities: {
      '${managedIdentityId}': {}
    }
  }
  properties: {
    // Knowledge graph stores skills, subagents, and operational runbooks
    knowledgeGraphConfiguration: {
      identity: managedIdentityId
      managedResources: [
        webAppId // Frontend - Contoso University Web App
        apiAppId // Backend  - Contoso University API
      ]
    }
    // Action configuration controls what the agent can do autonomously
    actionConfiguration: {
      accessLevel: accessLevel
      identity: managedIdentityId
      mode: agentMode
    }
    // Log configuration connects to App Insights for telemetry analysis
    logConfiguration: {
      applicationInsightsConfiguration: {
        appId: appInsightsAppId
        connectionString: appInsightsConnectionString
      }
    }
  }
  dependsOn: shouldCreateManagedIdentity ? [userAssignedIdentity] : []
}

// -----------------------------------------------------------------------------
// SRE Agent Administrator Role Assignment
// -----------------------------------------------------------------------------
// Grants the deployer SRE Agent Administrator access so they can manage the
// agent through the portal, configure workflows, and upload knowledge base docs.

resource sreAgentAdminRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbacAssignments) {
  name: guid(sreAgent.id, deployer().objectId, 'e79298df-d852-4c6d-84f9-5d13249d1e55')
  scope: sreAgent
  properties: {
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', 'e79298df-d852-4c6d-84f9-5d13249d1e55') // SRE Agent Administrator
    principalId: deployer().objectId
    principalType: 'User'
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------

output sreAgentName string = sreAgent.name
output sreAgentId string = sreAgent.id
output sreAgentPrincipalId string = sreAgent.identity.principalId
output userAssignedIdentityId string = managedIdentityId
output userAssignedIdentityPrincipalId string = shouldCreateManagedIdentity
  ? userAssignedIdentity!.properties.principalId
  : existingManagedIdentity!.properties.principalId
output sreAgentPortalUrl string = 'https://sre.azure.com/#/agent/${sreAgent.id}'
