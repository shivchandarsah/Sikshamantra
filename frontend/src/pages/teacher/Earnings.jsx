// Teacher Earnings Page
import { useState, useEffect } from 'react';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader';
import RefreshButton from '@/components/RefreshButton';
import teacherBalanceService from '@/utils/services/teacherBalanceService';
import { toast } from 'sonner';

export default function TeacherEarnings() {
  const [balance, setBalance] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Payout request
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, earningsRes, payoutsRes] = await Promise.all([
        teacherBalanceService.getBalance(),
        teacherBalanceService.getEarningsHistory({ limit: 10 }),
        teacherBalanceService.getPayoutHistory({ limit: 10 })
      ]);

      if (balanceRes.success) {
        setBalance(balanceRes.data);
      }

      if (earningsRes.success) {
        setEarnings(earningsRes.data.payments || []);
      }

      if (payoutsRes.success) {
        setPayouts(payoutsRes.data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > balance.availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum payout amount is NPR 100');
      return;
    }

    setRequestingPayout(true);
    try {
      const response = await teacherBalanceService.requestPayout(amount, payoutNote);

      if (response.success) {
        toast.success('Payout request submitted successfully');
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutNote('');
        fetchData();
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(error.message || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleCancelPayout = async (payoutId) => {
    if (!confirm('Are you sure you want to cancel this payout request?')) return;

    try {
      const response = await teacherBalanceService.cancelPayoutRequest(payoutId);
      if (response.success) {
        toast.success('Payout request cancelled');
        fetchData();
      }
    } catch (error) {
      console.error('Error cancelling payout:', error);
      toast.error(error.message || 'Failed to cancel payout');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
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
        title="Earnings & Payouts"
        subtitle="Manage your earnings and payment settings"
        action={<RefreshButton onRefresh={fetchData} />}
      />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Available</span>
          </div>
          <div className="text-3xl font-bold">NPR {balance?.availableBalance?.toFixed(2) || '0.00'}</div>
          <p className="text-sm opacity-80 mt-1">Ready to withdraw</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Pending</span>
          </div>
          <div className="text-3xl font-bold">NPR {balance?.pendingBalance?.toFixed(2) || '0.00'}</div>
          <p className="text-sm opacity-80 mt-1">In payout requests</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-sm opacity-80">Total Earned</span>
          </div>
          <div className="text-3xl font-bold">NPR {balance?.totalEarnings?.toFixed(2) || '0.00'}</div>
          <p className="text-sm opacity-80 mt-1">Lifetime earnings</p>
        </div>
      </div>

      {/* Payment Settings Alert */}
      {!balance?.esewaId && !balance?.esewaQRCode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">Payment Details Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please set up your eSewa payment details to receive payments from students
            </p>
            <Button
              onClick={() => window.location.href = '/teacher/payment-settings'}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700"
              size="sm"
            >
              Go to Payment Settings
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowPayoutModal(true)}
          disabled={!balance?.availableBalance || balance.availableBalance < 100 || (!balance?.esewaId && !balance?.esewaQRCode)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Payout
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'earnings', 'payouts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Earnings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Earnings</h3>
            {earnings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No earnings yet</p>
            ) : (
              <div className="space-y-3">
                {earnings.slice(0, 5).map((earning) => (
                  <div key={earning._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{earning.purpose}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-green-600">
                      +NPR {(earning.amount * 0.8).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payouts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Payouts</h3>
            {payouts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payout requests yet</p>
            ) : (
              <div className="space-y-3">
                {payouts.slice(0, 5).map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm">NPR {payout.amount}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Share</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earnings.map((earning) => (
                  <tr key={earning._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {earning.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {earning.user?.fullName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      NPR {earning.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      NPR {(earning.amount * 0.8).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      NPR {payout.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {payout.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payout.status === 'pending' && (
                        <Button
                          onClick={() => handleCancelPayout(payout._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Request Payout</h3>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  NPR {balance?.availableBalance?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Min: NPR 100)
                </label>
                <Input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="100"
                  max={balance?.availableBalance}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="Add a note for your payout request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Payout Method:</strong> eSewa
                </p>
                {balance?.esewaId && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>eSewa ID:</strong> {balance?.esewaId}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-2">
                  Payout will be sent to your configured eSewa account
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleRequestPayout}
                disabled={requestingPayout}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {requestingPayout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  'Request Payout'
                )}
              </Button>
              <Button
                onClick={() => setShowPayoutModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
