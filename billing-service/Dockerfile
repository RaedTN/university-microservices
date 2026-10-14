FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY BillingService.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
USER root
RUN apk add --no-cache curl \
    && mkdir -p /data \
    && chown "$APP_UID" /data
COPY --from=build /app/publish .
USER $APP_UID
ENV ASPNETCORE_URLS=http://+:5064
ENV BILLING_DB_PATH=/data/billing.db
EXPOSE 5064
ENTRYPOINT ["dotnet", "BillingService.dll"]
