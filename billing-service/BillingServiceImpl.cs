using BillingService.Data;
using BillingService.Models;
using Microsoft.Data.Sqlite;

namespace BillingService.Services
{
    public class BillingServiceImpl : IBillingService
    {
        private readonly BillingDatabase _database;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public BillingServiceImpl(BillingDatabase database, IHttpContextAccessor httpContextAccessor)
        {
            _database = database;
            _httpContextAccessor = httpContextAccessor;
        }

        public BillingSummary CalculateFees(string studentId, string specialty, string level)
        {
            RequireRole("ADMIN");
            decimal baseFee = level switch
            {
                "L1" => 1000m,
                "L2" => 1200m,
                "L3" => 1500m,
                _ => 1000m
            };
            decimal specialtyBonus = specialty switch
            {
                "GL" => 200m,
                "SI" => 150m,
                _ => 0m
            };
            decimal total = baseFee + specialtyBonus;

            using var connection = _database.Open();
            var existing = FindAccount(connection, studentId);
            decimal paid = existing?.PaidAmount ?? 0m;
            var summary = new BillingSummary
            {
                StudentId = studentId,
                Specialty = specialty,
                Level = level,
                TotalAmount = total,
                PaidAmount = paid,
                RemainingAmount = Math.Max(total - paid, 0m),
                Status = StatusFor(paid, total)
            };
            SaveAccount(connection, summary);
            return summary;
        }

        public BillingSummary AddPayment(string studentId, decimal amount)
        {
            RequireRole("ADMIN");
            using var connection = _database.Open();
            var summary = FindAccount(connection, studentId) ?? new BillingSummary
            {
                StudentId = studentId,
                Specialty = "UNKNOWN",
                Level = "UNKNOWN",
                TotalAmount = 0m,
                PaidAmount = 0m,
                RemainingAmount = 0m,
                Status = "UNPAID"
            };

            using (var insert = connection.CreateCommand())
            {
                insert.CommandText = "INSERT INTO payments (payment_id, student_id, amount, paid_at) VALUES ($id, $student, $amount, $date)";
                insert.Parameters.AddWithValue("$id", Guid.NewGuid().ToString());
                insert.Parameters.AddWithValue("$student", studentId);
                insert.Parameters.AddWithValue("$amount", amount);
                insert.Parameters.AddWithValue("$date", DateTime.UtcNow.ToString("o"));
                insert.ExecuteNonQuery();
            }

            summary.PaidAmount += amount;
            summary.RemainingAmount = Math.Max(summary.TotalAmount - summary.PaidAmount, 0m);
            summary.Status = StatusFor(summary.PaidAmount, summary.TotalAmount);
            SaveAccount(connection, summary);
            return summary;
        }

        public BillingSummary GetBillingStatus(string studentId)
        {
            RequireOwnOrAdmin(studentId);
            using var connection = _database.Open();
            return FindAccount(connection, studentId) ?? EmptySummary(studentId);
        }

        public PaymentHistory GetPaymentHistory(string studentId)
        {
            RequireOwnOrAdmin(studentId);
            using var connection = _database.Open();
            return new PaymentHistory
            {
                StudentId = studentId,
                Payments = ListPayments(connection, studentId),
                Summary = FindAccount(connection, studentId) ?? EmptySummary(studentId)
            };
        }

        public PaymentStatement GenerateStatement(string studentId)
        {
            RequireOwnOrAdmin(studentId);
            using var connection = _database.Open();
            var summary = FindAccount(connection, studentId) ?? EmptySummary(studentId);
            return new PaymentStatement
            {
                StudentId = studentId,
                Specialty = summary.Specialty,
                Level = summary.Level,
                TotalAmount = summary.TotalAmount,
                PaidAmount = summary.PaidAmount,
                RemainingAmount = summary.RemainingAmount,
                Status = summary.Status,
                UpToDate = summary.Status == "PAID",
                Payments = ListPayments(connection, studentId)
            };
        }

        public bool IsUpToDate(string studentId)
        {
            RequireOwnOrAdmin(studentId);
            using var connection = _database.Open();
            var summary = FindAccount(connection, studentId);
            return summary != null && summary.Status == "PAID";
        }

        private void RequireRole(params string[] roles)
        {
            var role = CurrentRole();
            if (role == null)
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }
            if (!roles.Contains(role))
            {
                throw new UnauthorizedAccessException("Forbidden");
            }
        }

        private void RequireOwnOrAdmin(string studentId)
        {
            var role = CurrentRole();
            var email = CurrentEmail();
            if (role == null)
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }
            if (role == "ADMIN")
            {
                return;
            }
            if (role == "ETUDIANT" && string.Equals(email, studentId, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
            throw new UnauthorizedAccessException("Forbidden");
        }

        private string? CurrentRole()
        {
            return _httpContextAccessor.HttpContext?.Items["role"] as string;
        }

        private string? CurrentEmail()
        {
            return _httpContextAccessor.HttpContext?.Items["email"] as string;
        }

        private static BillingSummary EmptySummary(string studentId)
        {
            return new BillingSummary
            {
                StudentId = studentId,
                Status = "UNPAID",
                TotalAmount = 0,
                PaidAmount = 0,
                RemainingAmount = 0
            };
        }

        private static string StatusFor(decimal paid, decimal total)
        {
            if (paid <= 0)
            {
                return "UNPAID";
            }
            if (total > 0 && paid >= total)
            {
                return "PAID";
            }
            return "PARTIAL";
        }

        private static BillingSummary? FindAccount(SqliteConnection connection, string studentId)
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT student_id, specialty, level, total_amount, paid_amount, remaining_amount, status FROM billing_accounts WHERE student_id = $id";
            command.Parameters.AddWithValue("$id", studentId);
            using var reader = command.ExecuteReader();
            if (!reader.Read())
            {
                return null;
            }
            return new BillingSummary
            {
                StudentId = reader.GetString(0),
                Specialty = reader.GetString(1),
                Level = reader.GetString(2),
                TotalAmount = Convert.ToDecimal(reader.GetDouble(3)),
                PaidAmount = Convert.ToDecimal(reader.GetDouble(4)),
                RemainingAmount = Convert.ToDecimal(reader.GetDouble(5)),
                Status = reader.GetString(6)
            };
        }

        private static void SaveAccount(SqliteConnection connection, BillingSummary summary)
        {
            using var command = connection.CreateCommand();
            command.CommandText = """
                INSERT INTO billing_accounts (student_id, specialty, level, total_amount, paid_amount, remaining_amount, status)
                VALUES ($id, $specialty, $level, $total, $paid, $remaining, $status)
                ON CONFLICT(student_id) DO UPDATE SET
                    specialty = excluded.specialty,
                    level = excluded.level,
                    total_amount = excluded.total_amount,
                    paid_amount = excluded.paid_amount,
                    remaining_amount = excluded.remaining_amount,
                    status = excluded.status
                """;
            command.Parameters.AddWithValue("$id", summary.StudentId);
            command.Parameters.AddWithValue("$specialty", summary.Specialty);
            command.Parameters.AddWithValue("$level", summary.Level);
            command.Parameters.AddWithValue("$total", summary.TotalAmount);
            command.Parameters.AddWithValue("$paid", summary.PaidAmount);
            command.Parameters.AddWithValue("$remaining", summary.RemainingAmount);
            command.Parameters.AddWithValue("$status", summary.Status);
            command.ExecuteNonQuery();
        }

        private static List<Payment> ListPayments(SqliteConnection connection, string studentId)
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT payment_id, student_id, amount, paid_at FROM payments WHERE student_id = $id ORDER BY paid_at";
            command.Parameters.AddWithValue("$id", studentId);
            using var reader = command.ExecuteReader();
            var payments = new List<Payment>();
            while (reader.Read())
            {
                payments.Add(new Payment
                {
                    PaymentId = reader.GetString(0),
                    StudentId = reader.GetString(1),
                    Amount = Convert.ToDecimal(reader.GetDouble(2)),
                    Date = DateTime.Parse(reader.GetString(3), null, System.Globalization.DateTimeStyles.RoundtripKind)
                });
            }
            return payments;
        }
    }
}
