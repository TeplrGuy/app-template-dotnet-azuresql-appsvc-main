using Azure.Identity;
using System;
using ContosoUniversity.API.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;


var builder = WebApplication.CreateBuilder(args);

// Connection string is provided via Key Vault reference in App Service settings
// or via ConnectionStrings:ContosoUniversityAPIContext in local development
var connectionString = builder.Configuration.GetConnectionString("ContosoUniversityAPIContext");

builder.Services.AddDbContext<ContosoUniversityAPIContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions => sqlOptions.EnableRetryOnFailure());
});

builder.Services.AddControllers();
builder.Services.AddApplicationInsightsTelemetry(builder.Configuration);

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ContosoUniversityAPIContext>();
    await DbInitializer.Initialize(db);
}

//if (env.IsDevelopment())
//{
//    app.UseDeveloperExceptionPage();
//}

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

// Register the Swagger generator and the Swagger UI middlewares
app.UseOpenApi();
app.UseSwaggerUi3();

app.Run();
