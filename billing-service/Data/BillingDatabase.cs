using Microsoft.Data.Sqlite;

namespace BillingService.Data;

public class BillingDatabase
{
    private readonly string _connectionString;

    public BillingDatabase(string databasePath)
    {
        _connectionString = new SqliteConnectionStringBuilder { DataSource = databasePath }.ToString();
        using var connection = Open();
        using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS billing_accounts (
                student_id TEXT PRIMARY KEY,
                specialty TEXT NOT NULL,
                level TEXT NOT NULL,
                total_amount REAL NOT NULL,
                paid_amount REAL NOT NULL,
                remaining_amount REAL NOT NULL,
                status TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS payments (
                payment_id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                amount REAL NOT NULL,
                paid_at TEXT NOT NULL
            );
            """;
        command.ExecuteNonQuery();
    }

    public SqliteConnection Open()
    {
        var connection = new SqliteConnection(_connectionString);
        connection.Open();
        return connection;
    }
}
