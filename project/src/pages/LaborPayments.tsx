import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { laborPaymentAPI, staffAPI, workOrderAPI } from '../utils/api';
import { Plus, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface LaborPayment {
  id: number;
  staff_id: number;
  work_order_id: number;
  amount: number;
  payment_type: 'hourly' | 'fixed' | 'bonus';
  hours_worked: number;
  payment_date: string;
  status: 'Pending' | 'Paid';
  notes: string;
  created_at: string;
  staff_name: string;
  staff_role: string;
  work_description: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  hourly_rate: number;
}

interface WorkOrder {
  id: number;
  description: string;
  flat_number: string;
}

const LaborPayments: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<LaborPayment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [formData, setFormData] = useState({
    staff_id: '',
    work_order_id: '',
    amount: '',
    payment_type: 'hourly' as 'hourly' | 'fixed' | 'bonus',
    hours_worked: '',
    payment_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    if (user?.role === 'admin') {
      fetchStaff();
      fetchWorkOrders();
    }
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await laborPaymentAPI.getAll();
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      setStaff(response.data.filter((s: Staff) => s.role !== 'watchman'));
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const response = await workOrderAPI.getAll();
      setWorkOrders(response.data.filter((wo: WorkOrder) => wo.status === 'Completed'));
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        staff_id: parseInt(formData.staff_id),
        work_order_id: parseInt(formData.work_order_id),
        amount: parseFloat(formData.amount),
        hours_worked: formData.hours_worked ? parseFloat(formData.hours_worked) : null
      };

      await laborPaymentAPI.create(submitData);
      setShowModal(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating payment');
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await laborPaymentAPI.updateStatus(id, { status });
      fetchPayments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating payment status');
    }
  };

  const calculateAmount = () => {
    const selectedStaff = staff.find(s => s.id === parseInt(formData.staff_id));
    if (selectedStaff && formData.payment_type === 'hourly' && formData.hours_worked) {
      const amount = selectedStaff.hourly_rate * parseFloat(formData.hours_worked);
      setFormData({ ...formData, amount: amount.toString() });
    }
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      work_order_id: '',
      amount: '',
      payment_type: 'hourly',
      hours_worked: '',
      payment_date: '',
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'Paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'hourly': return 'bg-blue-100 text-blue-800';
      case 'fixed': return 'bg-purple-100 text-purple-800';
      case 'bonus': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment => {
    switch (activeTab) {
      case 'pending': return payment.status === 'Pending';
      case 'paid': return payment.status === 'Paid';
      default: return true;
    }
  });

  const totalPending = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Labor Payments</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Payment</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Payments' },
            { key: 'pending', label: 'Pending' },
            { key: 'paid', label: 'Paid' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours/Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.staff_name}</div>
                      <div className="text-sm text-gray-500 capitalize">{payment.staff_role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {payment.work_description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentTypeColor(payment.payment_type)}`}>
                      {payment.payment_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      {payment.hours_worked && (
                        <div>{payment.hours_worked}h</div>
                      )}
                      <div className="font-medium">₹{payment.amount.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  {user?.role === 'admin' && payment.status === 'Pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleStatusUpdate(payment.id, 'Paid')}
                        className="text-green-600 hover:text-green-800 transition-colors duration-200"
                      >
                        Mark Paid
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create Labor Payment</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Staff Member</label>
                  <select
                    required
                    value={formData.staff_id}
                    onChange={(e) => {
                      setFormData({ ...formData, staff_id: e.target.value });
                      calculateAmount();
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Staff Member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role}) - ₹{member.hourly_rate}/hr
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Order</label>
                  <select
                    value={formData.work_order_id}
                    onChange={(e) => setFormData({ ...formData, work_order_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Work Order (Optional)</option>
                    {workOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.flat_number} - {order.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => {
                      setFormData({ ...formData, payment_type: e.target.value as any });
                      calculateAmount();
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="bonus">Bonus</option>
                  </select>
                </div>

                {formData.payment_type === 'hourly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hours Worked</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formData.hours_worked}
                      onChange={(e) => {
                        setFormData({ ...formData, hours_worked: e.target.value });
                        calculateAmount();
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
                  >
                    Create Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaborPayments;