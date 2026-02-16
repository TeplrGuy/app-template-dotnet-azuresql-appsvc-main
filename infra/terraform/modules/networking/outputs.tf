output "vnet_id" {
  description = "Virtual network resource ID."
  value       = azurerm_virtual_network.this.id
}

output "vnet_name" {
  description = "Virtual network name."
  value       = azurerm_virtual_network.this.name
}

output "app_integration_subnet_id" {
  description = "App Service VNet integration subnet ID."
  value       = azurerm_subnet.app_integration.id
}

output "private_endpoint_subnet_id" {
  description = "Private endpoint subnet ID."
  value       = azurerm_subnet.private_endpoints.id
}

output "sql_private_dns_zone_id" {
  description = "Private DNS zone ID for SQL Server."
  value       = azurerm_private_dns_zone.sql.id
}
