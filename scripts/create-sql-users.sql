-- ============================================================================
-- SQL Script: Create Managed Identity Users for Contoso University API
-- ============================================================================
-- Run this script in your Azure SQL Database as the AAD admin
-- 
-- To run in Azure Portal:
-- 1. Go to Azure Portal > Your SQL Database > Query Editor (preview)
-- 2. Sign in with your AAD account (the SQL AAD admin)
-- 3. Paste and run this script
-- ============================================================================

-- Create user for main API app
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'cntso-ecgs-api')
BEGIN
    CREATE USER [cntso-ecgs-api] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [cntso-ecgs-api];
    ALTER ROLE db_datawriter ADD MEMBER [cntso-ecgs-api];
    ALTER ROLE db_ddladmin ADD MEMBER [cntso-ecgs-api];
    PRINT 'Created user: cntso-ecgs-api';
END
ELSE
    PRINT 'User already exists: cntso-ecgs-api';
GO

-- Create user for staging slot
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'cntso-ecgs-api/slots/staging')
BEGIN
    CREATE USER [cntso-ecgs-api/slots/staging] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [cntso-ecgs-api/slots/staging];
    ALTER ROLE db_datawriter ADD MEMBER [cntso-ecgs-api/slots/staging];
    ALTER ROLE db_ddladmin ADD MEMBER [cntso-ecgs-api/slots/staging];
    PRINT 'Created user: cntso-ecgs-api/slots/staging';
END
ELSE
    PRINT 'User already exists: cntso-ecgs-api/slots/staging';
GO

-- Create user for QA slot
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'cntso-ecgs-api/slots/qa')
BEGIN
    CREATE USER [cntso-ecgs-api/slots/qa] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [cntso-ecgs-api/slots/qa];
    ALTER ROLE db_datawriter ADD MEMBER [cntso-ecgs-api/slots/qa];
    ALTER ROLE db_ddladmin ADD MEMBER [cntso-ecgs-api/slots/qa];
    PRINT 'Created user: cntso-ecgs-api/slots/qa';
END
ELSE
    PRINT 'User already exists: cntso-ecgs-api/slots/qa';
GO

-- Verify the users were created
SELECT name, type_desc, authentication_type_desc 
FROM sys.database_principals 
WHERE name LIKE 'cntso-ecgs-api%';
GO
