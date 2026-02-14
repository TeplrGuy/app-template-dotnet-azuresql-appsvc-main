resource "azurerm_log_analytics_workspace" "this" {
  name                = var.log_analytics_workspace_name
  resource_group_name = var.resource_group_name
  location            = var.location

  sku               = var.log_analytics_sku
  retention_in_days = var.log_analytics_retention_in_days

  tags = var.tags
}

resource "azurerm_application_insights" "this" {
  name                = var.application_insights_name
  resource_group_name = var.resource_group_name
  location            = var.location

  application_type = "web"
  workspace_id     = azurerm_log_analytics_workspace.this.id

  tags = var.tags

  # TODO: add diagnostic settings / alerts / dashboards as needed.
}
