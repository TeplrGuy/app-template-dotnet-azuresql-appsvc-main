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

  https_only = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = var.always_on

    application_stack {
      docker_registry_url = "https://${var.acr_login_server}"
      docker_image_name   = var.backend_image
    }
  }

  app_settings = {
    WEBSITES_PORT                          = "3000"
    SQLSERVER_CONNECTION_STRING             = var.sql_connection_string
    APPLICATIONINSIGHTS_CONNECTION_STRING   = var.app_insights_connection_string
    DOCKER_REGISTRY_SERVER_URL             = "https://${var.acr_login_server}"
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

    application_stack {
      docker_registry_url = "https://${var.acr_login_server}"
      docker_image_name   = var.frontend_image
    }
  }

  app_settings = {
    WEBSITES_PORT              = "80"
    DOCKER_REGISTRY_SERVER_URL = "https://${var.acr_login_server}"
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
