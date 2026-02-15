# Quickstart: Modernized Contoso University (React + Node)

This quickstart describes how developers will run the new React frontend and Node backend locally once implementation starts.

## Prerequisites

- Node.js 20 LTS
- Docker Desktop (recommended for local SQL Server)
- Git

## Database

The backend targets **Azure SQL / SQL Server**.

### Option A: Use an existing Azure SQL database

- Configure a connection string in your shell environment (exact name will match backend implementation):

```powershell
$env:SQLSERVER_CONNECTION_STRING = "Server=tcp:<server>.database.windows.net,1433;Initial Catalog=<db>;Persist Security Info=False;User ID=<user>;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
```

### Option B: Local SQL Server container (developer machine)

> Exact image/tag may vary.

```powershell
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_password123" -p 1433:1433 --name contoso-sql -d mcr.microsoft.com/mssql/server:2022-latest
```

## Backend (planned)

```powershell
cd backend
npm ci
npm run dev
```

### Run backend tests

```powershell
cd backend
npm test
npm run test:e2e
```

## Frontend (planned)

```powershell
cd frontend
npm ci
npm run dev
```

### Run frontend tests

```powershell
cd frontend
npm test
```

## E2E / Smoke tests (Playwright)

```powershell
cd frontend
npx playwright install --with-deps
npx playwright test
```

## Load testing (Azure Load Testing)

- Load test assets live under `/loadtests`.
- The CI pipeline will run the configured tests as a gate for staging/production promotion.

## Legacy app

The current .NET 6 app remains runnable during the migration:

```powershell
dotnet restore src\ContosoUniversity.sln
dotnet build src\ContosoUniversity.sln --configuration Release
```
