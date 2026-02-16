resource "azurerm_service_plan" "this" {
  name                = var.service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location

  os_type  = "Linux"
  sku_name = var.sku_name

  tags = var.tags
}

# Backend API (NestJS on Node 20, port 3000)
resource "azurerm_linux_web_app" "backend" {
  name                = var.backend_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.this.id

  https_only                    = true
  virtual_network_subnet_id     = var.app_integration_subnet_id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on          = var.always_on
    vnet_route_all_enabled = true

    container_registry_use_managed_identity = true

    application_stack {
      docker_registry_url = "https://${var.acr_login_server}"
      docker_image_name   = var.backend_image
    }
  }

  app_settings = {
    WEBSITES_PORT                        = "3000"
    SQLSERVER_CONNECTION_STRING           = var.sql_connection_string
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.app_insights_connection_string
  }

  logs {
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
    application_logs {
      file_system_level = "Information"
    }
  }

  tags = var.tags
}

# Frontend SPA (nginx on port 80)
resource "azurerm_linux_web_app" "frontend" {
  name                = var.frontend_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.this.id

  https_only = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = var.always_on

    container_registry_use_managed_identity = true

    application_stack {
      docker_registry_url = "https://${var.acr_login_server}"
      docker_image_name   = var.frontend_image
    }
  }

  app_settings = {
    WEBSITES_PORT  = "80"
    BACKEND_URL    = "https://${azurerm_linux_web_app.backend.default_hostname}"
  }

  logs {
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
    application_logs {
      file_system_level = "Information"
    }
  }

  tags = var.tags
}

# AcrPull role assignments for managed identities
resource "azurerm_role_assignment" "backend_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.backend.identity[0].principal_id
}

resource "azurerm_role_assignment" "frontend_acr_pull" {
  scope                = var.acr_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.frontend.identity[0].principal_id
}

# ── Diagnostic settings: stream App Service logs to Log Analytics ──

resource "azurerm_monitor_diagnostic_setting" "backend_diag" {
  name                       = "${var.backend_app_name}-diag"
  target_resource_id         = azurerm_linux_web_app.backend.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }
  enabled_log {
    category = "AppServiceConsoleLogs"
  }
  enabled_log {
    category = "AppServiceAppLogs"
  }
  enabled_log {
    category = "AppServicePlatformLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_monitor_diagnostic_setting" "frontend_diag" {
  name                       = "${var.frontend_app_name}-diag"
  target_resource_id         = azurerm_linux_web_app.frontend.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }
  enabled_log {
    category = "AppServiceConsoleLogs"
  }
  enabled_log {
    category = "AppServiceAppLogs"
  }
  enabled_log {
    category = "AppServicePlatformLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}
