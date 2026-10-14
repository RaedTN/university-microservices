// Models/BillingModels.cs
using System;
using System.Collections.Generic;

namespace BillingService.Models
{
    public class Payment
    {
        public string PaymentId { get; set; } = Guid.NewGuid().ToString();
        public string StudentId { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }
    }

    public class BillingSummary
    {
        public string StudentId { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;

        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string Status { get; set; } = "UNPAID"; // PAID / PARTIAL / UNPAID
    }

    public class PaymentHistory
    {
        public string StudentId { get; set; } = string.Empty;
        public List<Payment> Payments { get; set; } = new();
        public BillingSummary Summary { get; set; } = new();
    }

    public class PaymentStatement
    {
        public string StudentId { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public string Status { get; set; } = "UNPAID";
        public bool UpToDate { get; set; }
        public List<Payment> Payments { get; set; } = new();
    }
}
