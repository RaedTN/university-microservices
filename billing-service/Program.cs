using System.IdentityModel.Tokens.Jwt;
using System.Text;
using BillingService.Data;
using BillingService.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.IdentityModel.Tokens;
using SoapCore;

var builder = WebApplication.CreateBuilder(args);

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException("JWT_SECRET environment variable is required");
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddSoapCore();
builder.Services.AddSingleton(new BillingDatabase(Path.Combine(builder.Environment.ContentRootPath, "billing.db")));
builder.Services.AddSingleton<IBillingService, BillingServiceImpl>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    if (HttpMethods.IsGet(context.Request.Method))
    {
        await next();
        return;
    }

    var header = context.Request.Headers.Authorization.ToString();
    if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new { error = "Unauthorized" });
        return;
    }

    try
    {
        var handler = new JwtSecurityTokenHandler();
        handler.InboundClaimTypeMap.Clear();
        var principal = handler.ValidateToken(header["Bearer ".Length..].Trim(), new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        }, out _);
        context.Items["email"] = principal.FindFirst("sub")?.Value ?? principal.Identity?.Name ?? "";
        context.Items["role"] = principal.FindFirst("role")?.Value ?? "";
        await next();
    }
    catch (Exception)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new { error = "Unauthorized" });
    }
});

((IApplicationBuilder)app).UseSoapEndpoint<IBillingService>(
    "/BillingService.svc",
    new SoapEncoderOptions(),
    SoapSerializer.XmlSerializer);

app.Run();
