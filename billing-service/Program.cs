using SoapCore;
using BillingService.Services;
using Microsoft.AspNetCore.Builder;   // needed for IApplicationBuilder

var builder = WebApplication.CreateBuilder(args);

// Register SoapCore and your service implementation
builder.Services.AddSoapCore();
builder.Services.AddSingleton<IBillingService, BillingServiceImpl>();

var app = builder.Build();

app.UseDeveloperExceptionPage();

// Explicitly cast to IApplicationBuilder so the correct overload is used
((IApplicationBuilder)app).UseSoapEndpoint<IBillingService>(
    "/BillingService.svc",
    new SoapEncoderOptions(),
    SoapSerializer.XmlSerializer);

app.Run();
