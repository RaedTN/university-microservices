// Services/BillingServiceImpl.cs
using System;
using System.Collections.Generic;
using System.Linq;
using BillingService.Models;

namespace BillingService.Services
{
    public class BillingServiceImpl : IBillingService
    {
        // In-memory storage (for the TP it's enough)
        private static readonly Dictionary<string, BillingSummary> _summaries = new();
        private static readonly List<Payment> _payments = new();

        public BillingSummary CalculateFees(string studentId, string specialty, string level)
        {
            // Simple example fee rules (you can change them)
            decimal baseFee = level switch
            {
                "L1" => 1000m,
                "L2" => 1200m,
                "L3" => 1500m,
                _ => 1000m
            };

            // Specialty adjustment
            decimal specialtyBonus = specialty switch
            {
                "GL" => 200m,
                "SI" => 150m,
                _ => 0m
            };

            decimal total = baseFee + specialtyBonus;

            if (!_summaries.TryGetValue(studentId, out var summary))
            {
                summary = new BillingSummary
                {
                    StudentId = studentId,
                    Specialty = specialty,
                    Level = level,
                    TotalAmount = total,
                    PaidAmount = 0m,
                    RemainingAmount = total,
                    Status = "UNPAID"
                };

                _summaries[studentId] = summary;
            }
            else
            {
                // Update totals if needed
                summary.Specialty = specialty;
                summary.Level = level;
                summary.TotalAmount = total;
                summary.RemainingAmount = total - summary.PaidAmount;
                summary.Status = GetStatus(summary);
            }

            return summary;
        }

        public BillingSummary AddPayment(string studentId, decimal amount)
        {
            if (!_summaries.TryGetValue(studentId, out var summary))
            {
                // If no summary yet, we can either throw or initialize with default fees
                // Here we create a default summary
                summary = new BillingSummary
                {
                    StudentId = studentId,
                    Specialty = "UNKNOWN",
                    Level = "UNKNOWN",
                    TotalAmount = 0m,
                    PaidAmount = 0m,
                    RemainingAmount = 0m,
                    Status = "UNPAID"
                };
                _summaries[studentId] = summary;
            }

            var payment = new Payment
            {
                StudentId = studentId,
                Amount = amount,
                Date = DateTime.UtcNow
            };
            _payments.Add(payment);

            summary.PaidAmount += amount;
            summary.RemainingAmount = Math.Max(summary.TotalAmount - summary.PaidAmount, 0);
            summary.Status = GetStatus(summary);

            return summary;
        }

        public BillingSummary GetBillingStatus(string studentId)
        {
            if (!_summaries.TryGetValue(studentId, out var summary))
            {
                // Student not found → default UNPAID
                return new BillingSummary
                {
                    StudentId = studentId,
                    Status = "UNPAID",
                    TotalAmount = 0,
                    PaidAmount = 0,
                    RemainingAmount = 0
                };
            }

            summary.Status = GetStatus(summary);
            return summary;
        }

        public PaymentHistory GetPaymentHistory(string studentId)
        {
            var studentPayments = _payments
                .Where(p => p.StudentId == studentId)
                .OrderBy(p => p.Date)
                .ToList();

            _summaries.TryGetValue(studentId, out var summary);

            return new PaymentHistory
            {
                StudentId = studentId,
                Payments = studentPayments,
                Summary = summary ?? new BillingSummary { StudentId = studentId }
            };
        }

        private static string GetStatus(BillingSummary summary)
        {
            if (summary.PaidAmount <= 0)
                return "UNPAID";

            if (summary.PaidAmount >= summary.TotalAmount)
                return "PAID";

            return "PARTIAL";
        }
    }
}
