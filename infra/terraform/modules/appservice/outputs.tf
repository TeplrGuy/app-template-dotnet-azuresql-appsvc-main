output "service_plan_id" {
  description = "App Service Plan resource ID."
  value       = azurerm_service_plan.this.id
}

output "backend_app_id" {
  description = "Backend Web App resource ID."
  value       = azurerm_linux_web_app.backend.id
}

output "backend_app_name" {
  description = "Backend Web App name."
  value       = azurerm_linux_web_app.backend.name
}

output "backend_default_hostname" {
  description = "Default hostname of the backend Web App."
  value       = azurerm_linux_web_app.backend.default_hostname
}

output "backend_principal_id" {
  description = "Backend managed identity principal ID."
  value       = azurerm_linux_web_app.backend.identity[0].principal_id
}

output "frontend_app_id" {
  description = "Frontend Web App resource ID."
  value       = azurerm_linux_web_app.frontend.id
}

output "frontend_app_name" {
  description = "Frontend Web App name."
  value       = azurerm_linux_web_app.frontend.name
}

output "frontend_default_hostname" {
  description = "Default hostname of the frontend Web App."
  value       = azurerm_linux_web_app.frontend.default_hostname
}

output "frontend_principal_id" {
  description = "Frontend managed identity principal ID."
  value       = azurerm_linux_web_app.frontend.identity[0].principal_id
}
