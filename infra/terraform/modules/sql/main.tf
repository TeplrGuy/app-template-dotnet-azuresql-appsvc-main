resource "azurerm_mssql_server" "this" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location
  version             = "12.0"

  # Disable public network access — only reachable via private endpoint
  public_network_access_enabled = false

  azuread_administrator {
    login_username              = var.aad_admin_login
    object_id                   = var.aad_admin_object_id
    tenant_id                   = var.aad_admin_tenant_id
    azuread_authentication_only = true
  }

  tags = var.tags
}

resource "azurerm_mssql_database" "this" {
  name        = var.database_name
  server_id   = azurerm_mssql_server.this.id
  sku_name    = var.sku_name
  max_size_gb = var.max_size_gb

  tags = var.tags
}

# Private endpoint for SQL Server
resource "azurerm_private_endpoint" "sql" {
  name                = "${var.server_name}-pe"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.server_name}-psc"
    private_connection_resource_id = azurerm_mssql_server.this.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "sql-dns-zone-group"
    private_dns_zone_ids = [var.sql_private_dns_zone_id]
  }

  tags = var.tags
}
