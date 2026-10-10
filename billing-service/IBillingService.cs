// IBillingService.cs
using System.ServiceModel;
using BillingService.Models;

namespace BillingService.Services
{
    [ServiceContract]
    public interface IBillingService
    {
        [OperationContract]
        BillingSummary CalculateFees(string studentId, string specialty, string level);

        [OperationContract]
        BillingSummary AddPayment(string studentId, decimal amount);

        [OperationContract]
        BillingSummary GetBillingStatus(string studentId);

        [OperationContract]
        PaymentHistory GetPaymentHistory(string studentId);
    }
}
