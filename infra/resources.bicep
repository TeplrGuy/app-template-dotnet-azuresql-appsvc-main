// =============================================================================
// Contoso University - Resource Definitions
// =============================================================================
// All Azure resources for the application
// Includes Key Vault for secrets, SQL initialization, and proper app configuration
// 
// Supports two authentication modes:
// - 'sql': SQL authentication with deployment script to create app user
// - 'aad': Azure AD-only authentication (MCAPS compliant) with Managed Identity
// =============================================================================

param environmentName string
param location string
param webServiceName string
param apiServiceName string

@description('SQL authentication mode: sql = SQL auth with app user, aad = Azure AD only')
@allowed(['sql', 'aad'])
param sqlAuthMode string = 'aad'

// SQL Authentication parameters (only used when sqlAuthMode = 'sql')
@description('SQL Server admin username (only for SQL auth mode)')
param sqlAdminUsername string = 'sqladmin'

@secure()
@description('SQL Server admin password (only for SQL auth mode)')
param sqlAdminPassword string = ''

@secure()
@description('SQL App user password (only for SQL auth mode)')
param sqlAppUserPassword string = ''

@description('SQL App username for application connections (only for SQL auth mode)')
param sqlAppUser string = 'appUser'

// Azure AD Authentication parameters (only used when sqlAuthMode = 'aad')
@description('Azure AD SQL Admin display name (only for AAD auth mode)')
param sqlAadAdminName string = ''

@description('Azure AD SQL Admin Object ID (only for AAD auth mode)')
param sqlAadAdminObjectId string = ''

@description('Key name for SQL connection string in Key Vault')
param sqlConnectionStringKey string = 'AZURE-SQL-CONNECTION-STRING'

@description('Deploy Key Vault RBAC role assignments (requires User Access Administrator or Owner role)')
param deployRbacAssignments bool = false

// Tags for all resources
var tags = {
  environment: environmentName
  project: 'ContosoUniversity'
  'azd-env-name': environmentName
}

// Naming conventions
var keyVaultName = 'kv-${environmentName}'
var sqlServerName = 'sql-${environmentName}'
var sqlDatabaseName = 'sqldb-${environmentName}'
var appServicePlanName = 'plan-${environmentName}'
var appInsightsName = 'appi-${environmentName}'
var logAnalyticsName = 'log-${environmentName}'
var loadTestingName = 'lt-${environmentName}'
var sreAgentName = 'sre-${environmentName}'
var vnetName = 'vnet-${environmentName}'
var appSubnetName = 'snet-app'
var privateEndpointSubnetName = 'snet-pe'

// =============================================================================
// Virtual Network for Private Connectivity
// =============================================================================
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: appSubnetName
        properties: {
          addressPrefix: '10.0.1.0/24'
          delegations: [
            {
              name: 'Microsoft.Web.serverFarms'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: privateEndpointSubnetName
        properties: {
          addressPrefix: '10.0.2.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

// =============================================================================
// Private DNS Zone for SQL Server
// =============================================================================
resource privateDnsZoneSql 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink${environment().suffixes.sqlServerHostname}'
  location: 'global'
  tags: tags
}

resource privateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZoneSql
  name: '${vnetName}-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

// =============================================================================
// Log Analytics Workspace
// =============================================================================
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// =============================================================================
// Application Insights
// =============================================================================
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// =============================================================================
// Key Vault
// =============================================================================
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
  }
}

// =============================================================================
// App Service Plan
// =============================================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'S1'
    tier: 'Standard'
    capacity: 1
  }
  properties: {
    reserved: false // Windows
  }
}

// =============================================================================
// Web App (MVC Frontend)
// =============================================================================
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: webServiceName
  location: location
  tags: union(tags, { 'azd-service-name': 'web' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      netFrameworkVersion: 'v6.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'Api__Address'
          value: 'https://${apiServiceName}.azurewebsites.net'
        }
      ]
    }
  }

  // Staging slot for zero-downtime deployments
  resource stagingSlot 'slots' = {
    name: 'staging'
    location: location
    tags: tags
    properties: {
      serverFarmId: appServicePlan.id
    }
  }

  // QA slot for testing
  resource qaSlot 'slots' = {
    name: 'qa'
    location: location
    tags: tags
    properties: {
      serverFarmId: appServicePlan.id
    }
  }
}

// =============================================================================
// Sticky Slot Settings (Settings that stay with the slot during swap)
// =============================================================================
// Mark Api__Address as a slot-specific (sticky) setting so that each slot
// retains its own API endpoint URL during a staging-to-production swap.
// Without this, the staging Api__Address value travels with the swapped code
// into production, causing 500 errors.
resource webAppSlotConfigNames 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: webApp
  name: 'slotConfigNames'
  properties: {
    appSettingNames: [
      'Api__Address'
    ]
  }
}

// =============================================================================
// API App (Web API Backend)
// =============================================================================
resource apiApp 'Microsoft.Web/sites@2022-09-01' = {
  name: apiServiceName
  location: location
  tags: union(tags, { 'azd-service-name': 'api' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: '${vnet.id}/subnets/${appSubnetName}'
    siteConfig: {
      netFrameworkVersion: 'v6.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      vnetRouteAllEnabled: true
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'WEBSITE_DNS_SERVER'
          value: '168.63.129.16'
        }
      ]
    }
  }
}

// API App Staging Slot - needs VNet integration and managed identity for Key Vault access
resource apiStagingSlot 'Microsoft.Web/sites/slots@2022-09-01' = {
  parent: apiApp
  name: 'staging'
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: '${vnet.id}/subnets/${appSubnetName}'
    siteConfig: {
      netFrameworkVersion: 'v6.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      vnetRouteAllEnabled: true
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'WEBSITE_DNS_SERVER'
          value: '168.63.129.16'
        }
      ]
    }
  }
}

// API App QA Slot - needs VNet integration and managed identity for Key Vault access
resource apiQaSlot 'Microsoft.Web/sites/slots@2022-09-01' = {
  parent: apiApp
  name: 'qa'
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    virtualNetworkSubnetId: '${vnet.id}/subnets/${appSubnetName}'
    siteConfig: {
      netFrameworkVersion: 'v6.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      vnetRouteAllEnabled: true
      appSettings: [
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'WEBSITE_DNS_SERVER'
          value: '168.63.129.16'
        }
      ]
    }
  }
}

// Key Vault access for API QA Slot
resource apiQaSlotKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbacAssignments) {
  name: guid(keyVault.id, apiQaSlot.id, keyVaultSecretsUserRole)
  scope: keyVault
  properties: {
    principalId: apiQaSlot.identity.principalId
    roleDefinitionId: keyVaultSecretsUserRole
    principalType: 'ServicePrincipal'
  }
}

// API QA Slot Settings - configured after Key Vault access is ready
resource apiQaSlotSettings 'Microsoft.Web/sites/slots/config@2022-09-01' = {
  parent: apiQaSlot
  name: 'appsettings'
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    ApplicationInsightsAgent_EXTENSION_VERSION: '~3'
    ConnectionStrings__ContosoUniversityAPIContext: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${sqlConnectionStringKey})'
  }
  dependsOn: [
    sqlConnectionStringSecretSql
    sqlConnectionStringSecretAad
  ]
}

// Key Vault access for API Staging Slot
resource apiStagingSlotKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbacAssignments) {
  name: guid(keyVault.id, apiStagingSlot.id, keyVaultSecretsUserRole)
  scope: keyVault
  properties: {
    principalId: apiStagingSlot.identity.principalId
    roleDefinitionId: keyVaultSecretsUserRole
    principalType: 'ServicePrincipal'
  }
}

// API Staging Slot Settings - configured after Key Vault access is ready
resource apiStagingSlotSettings 'Microsoft.Web/sites/slots/config@2022-09-01' = {
  parent: apiStagingSlot
  name: 'appsettings'
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    ApplicationInsightsAgent_EXTENSION_VERSION: '~3'
    ConnectionStrings__ContosoUniversityAPIContext: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${sqlConnectionStringKey})'
  }
  dependsOn: [
    sqlConnectionStringSecretSql
    sqlConnectionStringSecretAad
  ]
}
// Using Key Vault references to avoid race conditions during app startup
resource apiAppSettings 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: apiApp
  name: 'appsettings'
  properties: {
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    ApplicationInsightsAgent_EXTENSION_VERSION: '~3'
    ConnectionStrings__ContosoUniversityAPIContext: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=${sqlConnectionStringKey})'
  }
  dependsOn: [
    sqlConnectionStringSecretSql
    sqlConnectionStringSecretAad
  ]
}

// =============================================================================
// Key Vault Access for Apps (RBAC)
// =============================================================================
// Key Vault Secrets User role
var keyVaultSecretsUserRole = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '4633458b-17de-408a-b874-0445c86b69e6'
)

resource webAppKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbacAssignments) {
  name: guid(keyVault.id, webApp.id, keyVaultSecretsUserRole)
  scope: keyVault
  properties: {
    principalId: webApp.identity.principalId
    roleDefinitionId: keyVaultSecretsUserRole
    principalType: 'ServicePrincipal'
  }
}

resource apiAppKeyVaultAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployRbacAssignments) {
  name: guid(keyVault.id, apiApp.id, keyVaultSecretsUserRole)
  scope: keyVault
  properties: {
    principalId: apiApp.identity.principalId
    roleDefinitionId: keyVaultSecretsUserRole
    principalType: 'ServicePrincipal'
  }
}

// =============================================================================
// SQL Server (Different configuration based on auth mode)
// =============================================================================

// SQL Server with SQL Authentication (for environments that allow it)
resource sqlServerSqlAuth 'Microsoft.Sql/servers@2022-05-01-preview' = if (sqlAuthMode == 'sql') {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
  }
}

// SQL Server with Azure AD Only Authentication (MCAPS compliant)
resource sqlServerAadAuth 'Microsoft.Sql/servers@2022-05-01-preview' = if (sqlAuthMode == 'aad') {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: 'User'
      login: sqlAadAdminName
      sid: sqlAadAdminObjectId
      tenantId: subscription().tenantId
      azureADOnlyAuthentication: true
    }
  }
}

// Private Endpoint for SQL Server
resource sqlPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: 'pe-${sqlServerName}'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: '${vnet.id}/subnets/${privateEndpointSubnetName}'
    }
    privateLinkServiceConnections: [
      {
        name: 'sqlConnection'
        properties: {
          privateLinkServiceId: sqlAuthMode == 'sql' ? sqlServerSqlAuth.id : sqlServerAadAuth.id
          groupIds: ['sqlServer']
        }
      }
    ]
  }
}

// DNS record for SQL Private Endpoint
resource sqlPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: sqlPrivateEndpoint
  name: 'sqlDnsGroup'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: privateDnsZoneSql.id
        }
      }
    ]
  }
}

// Reference to the active SQL Server (whichever mode is used)
// Using environment suffix for cloud compatibility
var sqlServerFqdn = '${sqlServerName}${environment().suffixes.sqlServerHostname}'

// =============================================================================
// SQL Database (attached to whichever SQL Server was created)
// =============================================================================
resource sqlDatabaseSqlAuth 'Microsoft.Sql/servers/databases@2022-05-01-preview' = if (sqlAuthMode == 'sql') {
  parent: sqlServerSqlAuth
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'S0'
    tier: 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2GB
  }
}

resource sqlDatabaseAadAuth 'Microsoft.Sql/servers/databases@2022-05-01-preview' = if (sqlAuthMode == 'aad') {
  parent: sqlServerAadAuth
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'S0'
    tier: 'Standard'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648 // 2GB
  }
}

// =============================================================================
// SQL Deployment Script - Create App User (Only for SQL Auth Mode)
// =============================================================================
resource sqlDeploymentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = if (sqlAuthMode == 'sql') {
  name: '${sqlServerName}-init-script'
  location: location
  kind: 'AzureCLI'
  properties: {
    azCliVersion: '2.37.0'
    retentionInterval: 'PT1H'
    timeout: 'PT5M'
    cleanupPreference: 'OnSuccess'
    environmentVariables: [
      {
        name: 'APPUSERNAME'
        value: sqlAppUser
      }
      {
        name: 'APPUSERPASSWORD'
        secureValue: sqlAppUserPassword
      }
      {
        name: 'DBNAME'
        value: sqlDatabaseName
      }
      {
        name: 'DBSERVER'
        value: sqlServerFqdn
      }
      {
        name: 'SQLCMDPASSWORD'
        secureValue: sqlAdminPassword
      }
      {
        name: 'SQLADMIN'
        value: sqlAdminUsername
      }
    ]
    scriptContent: '''
      wget https://github.com/microsoft/go-sqlcmd/releases/download/v0.8.1/sqlcmd-v0.8.1-linux-x64.tar.bz2
      tar x -f sqlcmd-v0.8.1-linux-x64.tar.bz2 -C .

      cat <<SCRIPT_END > ./initDb.sql
      IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '${APPUSERNAME}')
      BEGIN
        CREATE USER [${APPUSERNAME}] WITH PASSWORD = '${APPUSERPASSWORD}'
      END
      GO
      ALTER ROLE db_datareader ADD MEMBER [${APPUSERNAME}]
      GO
      ALTER ROLE db_datawriter ADD MEMBER [${APPUSERNAME}]
      GO
      ALTER ROLE db_ddladmin ADD MEMBER [${APPUSERNAME}]
      GO
      SCRIPT_END

      ./sqlcmd -S ${DBSERVER} -d ${DBNAME} -U ${SQLADMIN} -i ./initDb.sql
    '''
  }
  dependsOn: [
    sqlDatabaseSqlAuth
  ]
}

// =============================================================================
// SQL Deployment Script - Create Users from Managed Identities (AAD Auth Mode)
// =============================================================================
// DISABLED: This deployment script requires VNet access and role assignments
// that the pipeline doesn't have permission to create.
// 
// For AAD authentication mode, SQL database users must be created manually
// by an AAD admin using the following SQL commands:
//
// -- Connect to your SQL database as AAD admin, then run:
// CREATE USER [your-api-app-name] FROM EXTERNAL PROVIDER;
// ALTER ROLE db_datareader ADD MEMBER [your-api-app-name];
// ALTER ROLE db_datawriter ADD MEMBER [your-api-app-name];
// ALTER ROLE db_ddladmin ADD MEMBER [your-api-app-name];
//
// -- Repeat for slots:
// CREATE USER [your-api-app-name/slots/staging] FROM EXTERNAL PROVIDER;
// ALTER ROLE db_datareader ADD MEMBER [your-api-app-name/slots/staging];
// ALTER ROLE db_datawriter ADD MEMBER [your-api-app-name/slots/staging];
// ALTER ROLE db_ddladmin ADD MEMBER [your-api-app-name/slots/staging];
//
// CREATE USER [your-api-app-name/slots/qa] FROM EXTERNAL PROVIDER;
// ALTER ROLE db_datareader ADD MEMBER [your-api-app-name/slots/qa];
// ALTER ROLE db_datawriter ADD MEMBER [your-api-app-name/slots/qa];
// ALTER ROLE db_ddladmin ADD MEMBER [your-api-app-name/slots/qa];
// =============================================================================

/* DISABLED - Requires role assignment permissions
resource sqlAadDeploymentScriptIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = if (sqlAuthMode == 'aad') {
  name: 'id-${sqlServerName}-deploy'
  location: location
  tags: tags
}

resource sqlDeployScriptRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (sqlAuthMode == 'aad' && deployRbacAssignments) {
  name: guid(resourceGroup().id, sqlAadDeploymentScriptIdentity.id, 'Storage-File-Data-Contrib')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '69566ab7-960f-475b-8e7c-b3118f30c6bd')
    principalId: sqlAadDeploymentScriptIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource sqlAadDeploymentScript 'Microsoft.Resources/deploymentScripts@2023-08-01' = if (sqlAuthMode == 'aad') {
  ...
}
*/

// =============================================================================
// Key Vault Secrets (conditional based on auth mode)
// =============================================================================

// Secrets for SQL Auth mode
resource sqlAdminPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (sqlAuthMode == 'sql') {
  parent: keyVault
  name: 'sqlAdminPassword'
  properties: {
    value: sqlAdminPassword
  }
}

resource appUserPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (sqlAuthMode == 'sql') {
  parent: keyVault
  name: 'appUserPassword'
  properties: {
    value: sqlAppUserPassword
  }
}

// SQL Connection String - different format based on auth mode
var sqlConnectionStringSql = 'Server=tcp:${sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAppUser};Password=${sqlAppUserPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
var sqlConnectionStringAad = 'Server=tcp:${sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication=Active Directory Default;'

// For SQL auth, depends on deployment script; for AAD auth, depends on database
resource sqlConnectionStringSecretSql 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (sqlAuthMode == 'sql') {
  parent: keyVault
  name: sqlConnectionStringKey
  properties: {
    value: sqlConnectionStringSql
  }
  dependsOn: [sqlDeploymentScript]
}

resource sqlConnectionStringSecretAad 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = if (sqlAuthMode == 'aad') {
  parent: keyVault
  name: sqlConnectionStringKey
  properties: {
    value: sqlConnectionStringAad
  }
  dependsOn: [sqlDatabaseAadAuth]
}

// =============================================================================
// Azure Load Testing
// =============================================================================
resource loadTesting 'Microsoft.LoadTestService/loadTests@2022-12-01' = {
  name: loadTestingName
  location: location
  tags: tags
  properties: {}
}

// =============================================================================
// Azure SRE Agent (Preview)
// =============================================================================
// The SRE Agent provides AI-powered incident detection, root cause analysis,
// and automated remediation integrated with GitHub. Deployed as a dedicated
// module following the official microsoft/sre-agent Bicep pattern with
// UserAssigned + SystemAssigned identity, knowledge graph, and action config.
//
// Monitors both:
//   - Frontend: Contoso University Web App (MVC)
//   - Backend:  Contoso University API
// =============================================================================

@description('Enable Azure SRE Agent for automated incident response')
param enableSreAgent bool = true

@description('SRE Agent mode: Review = human approval required, Autonomous = auto-remediate, ReadOnly = observe only')
@allowed(['Review', 'Autonomous', 'ReadOnly'])
param sreAgentMode string = 'Review'

@description('GitHub repository URL for SRE Agent code integration (e.g., https://github.com/owner/repo)')
param githubRepoUrl string = ''

// SRE Agent is only available in limited preview regions
// (swedencentral, eastus2, australiaeast, uksouth)
var sreAgentLocation = 'eastus2'

// Deploy the SRE Agent resource with managed identity and telemetry configuration
module sreAgentModule 'sre-agent/sre-agent.bicep' = if (enableSreAgent) {
  name: 'sre-agent-${uniqueString(deployment().name)}'
  params: {
    agentName: sreAgentName
    location: sreAgentLocation
    accessLevel: 'High'
    agentMode: sreAgentMode
    appInsightsId: appInsights.id
    appInsightsAppId: appInsights.properties.AppId
    appInsightsConnectionString: appInsights.properties.ConnectionString
    logAnalyticsWorkspaceId: logAnalytics.id
    webAppId: webApp.id
    apiAppId: apiApp.id
    githubRepoUrl: githubRepoUrl
    deployRbacAssignments: deployRbacAssignments
    tags: union(tags, { purpose: 'sre-automation' })
  }
}

// Deploy role assignments granting the SRE Agent access to monitored resources
module sreAgentRoles 'sre-agent/role-assignments.bicep' = if (enableSreAgent && deployRbacAssignments) {
  name: 'sre-agent-roles-${uniqueString(deployment().name)}'
  params: {
    userAssignedIdentityPrincipalId: sreAgentModule!.outputs.userAssignedIdentityPrincipalId
    systemAssignedIdentityPrincipalId: sreAgentModule!.outputs.sreAgentPrincipalId
    accessLevel: 'High'
    webAppId: webApp.id
    apiAppId: apiApp.id
    appInsightsId: appInsights.id
    logAnalyticsId: logAnalytics.id
  }
}

// =============================================================================
// Outputs
// =============================================================================
output webAppName string = webApp.name
output apiAppName string = apiApp.name
output sqlServerName string = sqlServerName
output sqlDatabaseName string = sqlDatabaseName
output keyVaultName string = keyVault.name
output keyVaultEndpoint string = keyVault.properties.vaultUri
output appInsightsName string = appInsights.name
output loadTestingName string = loadTesting.name
output sreAgentName string = enableSreAgent ? sreAgentModule!.outputs.sreAgentName : ''
output sreAgentMode string = sreAgentMode
output sreAgentId string = enableSreAgent ? sreAgentModule!.outputs.sreAgentId : ''
output sreAgentPortalUrl string = enableSreAgent ? sreAgentModule!.outputs.sreAgentPortalUrl : ''
output webUri string = 'https://${webApp.properties.defaultHostName}'
output apiUri string = 'https://${apiApp.properties.defaultHostName}'
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output sqlServerFqdn string = sqlServerFqdn
output sqlAuthMode string = sqlAuthMode
