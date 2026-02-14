output "service_plan_id" {
  description = "App Service Plan resource ID."
  value       = azurerm_service_plan.this.id
}

output "web_app_id" {
  description = "Web App resource ID."
  value       = azurerm_windows_web_app.this.id
}

output "web_app_default_hostname" {
  description = "Default hostname of the Web App."
  value       = azurerm_windows_web_app.this.default_hostname
}
