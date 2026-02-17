// Payment History Page with Proof
import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Filter, 
  Loader2, 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  DollarSign,
  Hash,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import RefreshButton from '@/components/RefreshButton';
import paymentService from '@/utils/services/paymentService';
import { toast } from 'sonner';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') {
        filters.status = filter;
      }

      const response = await paymentService.getPaymentHistory(filters);
      if (response.success) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(error.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProof = (payment) => {
    setSelectedPayment(payment);
    setShowProofModal(true);
  };

  const handleDownloadProof = () => {
    if (!selectedPayment) return;

    // Create a simple text receipt
    const receipt = `
PAYMENT RECEIPT
=====================================

Transaction ID: ${selectedPayment.transactionId}
Date: ${new Date(selectedPayment.createdAt).toLocaleString()}
Status: ${selectedPayment.status.toUpperCase()}

Purpose: ${selectedPayment.purpose}
Amount: NPR ${selectedPayment.amount}

${selectedPayment.esewaRefId ? `eSewa Reference: ${selectedPayment.esewaRefId}` : ''}

Payment Method: eSewa
Platform: Siksha Mantra

Teacher Share (80%): NPR ${(selectedPayment.amount * 0.8).toFixed(2)}
Platform Fee (20%): NPR ${(selectedPayment.amount * 0.2).toFixed(2)}

=====================================
This is a computer-generated receipt.
No signature required.
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-receipt-${selectedPayment.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Receipt downloaded successfully');
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    return (
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment History"
        subtitle="View all your payment transactions and download receipts"
        action={<RefreshButton onRefresh={fetchPayments} />}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by transaction ID or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['all', 'success', 'pending', 'failed'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              className={filter === status ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'Your payment history will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {payment.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      NPR {payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        onClick={() => handleViewProof(payment)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Proof
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredPayments.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Successful Payments</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredPayments.filter(p => p.status === 'success').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                NPR {filteredPayments
                  .filter(p => p.status === 'success')
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {showProofModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Payment Proof</h3>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${
                selectedPayment.status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : selectedPayment.status === 'pending'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedPayment.status === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : selectedPayment.status === 'pending' ? (
                    <Clock className="w-8 h-8 text-yellow-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">
                      Payment {selectedPayment.status === 'success' ? 'Successful' : selectedPayment.status === 'pending' ? 'Pending' : 'Failed'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedPayment.status === 'success' 
                        ? 'Your payment has been processed successfully' 
                        : selectedPayment.status === 'pending'
                        ? 'Your payment is being processed'
                        : 'Your payment could not be processed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">Transaction Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Transaction ID</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedPayment.transactionId}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedPayment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Purpose</p>
                      <p className="font-semibold text-gray-900 capitalize">{selectedPayment.purpose}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="font-semibold text-green-600 text-lg">NPR {selectedPayment.amount}</p>
                    </div>
                  </div>

                  {selectedPayment.esewaRefId && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">eSewa Reference ID</p>
                        <p className="font-mono font-semibold text-gray-900">{selectedPayment.esewaRefId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Breakdown */}
              {selectedPayment.status === 'success' && (
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Payment Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-semibold">NPR {selectedPayment.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teacher Receives (80%)</span>
                      <span className="font-semibold text-green-600">NPR {(selectedPayment.amount * 0.8).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee (20%)</span>
                      <span className="font-semibold text-gray-600">NPR {(selectedPayment.amount * 0.2).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-300 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="font-bold text-gray-900">NPR {selectedPayment.amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Note */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> This payment proof serves as confirmation that you have paid the teacher through the Siksha Mantra platform. 
                  The teacher will receive their share (80%) after platform commission deduction. You can download this receipt for your records.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <Button
                onClick={handleDownloadProof}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button
                onClick={() => setShowProofModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
