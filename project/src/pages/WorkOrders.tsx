import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { workOrderAPI, staffAPI, flatAPI } from '../utils/api';
import { Plus, Clock, CheckCircle, AlertTriangle, User, Wrench } from 'lucide-react';

interface WorkOrder {
  id: number;
  complaint_id: number;
  assigned_to: number;
  flat_id: number;
  work_type: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Assigned' | 'In Progress' | 'Completed' | 'On Hold';
  estimated_hours: number;
  actual_hours: number;
  materials_needed: string;
  cost: number;
  started_at: string;
  completed_at: string;
  created_at: string;
  complaint_title: string;
  flat_number: string;
  assigned_to_name: string;
  staff_role: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
}

interface Flat {
  id: number;
  flat_number: string;
}

const WorkOrders: React.FC = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'in-progress' | 'completed'>('all');
  const [formData, setFormData] = useState({
    assigned_to: '',
    flat_id: '',
    work_type: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    estimated_hours: '',
    materials_needed: ''
  });

  useEffect(() => {
    fetchWorkOrders();
    if (user?.role === 'admin') {
      fetchStaff();
      fetchFlats();
    }
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const response = await workOrderAPI.getAll();
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
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

  const fetchFlats = async () => {
    try {
      const response = await flatAPI.getAll();
      setFlats(response.data);
    } catch (error) {
      console.error('Error fetching flats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        assigned_to: parseInt(formData.assigned_to),
        flat_id: parseInt(formData.flat_id),
        estimated_hours: parseFloat(formData.estimated_hours)
      };

      await workOrderAPI.create(submitData);
      setShowModal(false);
      resetForm();
      fetchWorkOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating work order');
    }
  };

  const handleStatusUpdate = async (id: number, status: string, actual_hours?: number) => {
    try {
      await workOrderAPI.updateStatus(id, { status, actual_hours });
      fetchWorkOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating work order');
    }
  };

  const resetForm = () => {
    setFormData({
      assigned_to: '',
      flat_id: '',
      work_type: '',
      description: '',
      priority: 'Medium',
      estimated_hours: '',
      materials_needed: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'On Hold':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Assigned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWorkOrders = workOrders.filter(order => {
    switch (activeTab) {
      case 'assigned': return order.status === 'Assigned';
      case 'in-progress': return order.status === 'In Progress';
      case 'completed': return order.status === 'Completed';
      default: return true;
    }
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Work Order</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' }
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

      {/* Work Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkOrders.map((order) => (
          <div key={order.id} className="bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{order.description}</h3>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                  {order.priority}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Flat:</span>
                  <span className="font-medium text-gray-900">{order.flat_number}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{order.work_type}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-gray-500">Assigned to:</span>
                  <p className="text-gray-900">{order.assigned_to_name} ({order.staff_role})</p>
                </div>

                {order.materials_needed && (
                  <div className="text-sm">
                    <span className="text-gray-500">Materials:</span>
                    <p className="text-gray-900 mt-1 line-clamp-2">{order.materials_needed}</p>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. Hours:</span>
                  <span className="text-gray-900">{order.estimated_hours}h</span>
                </div>

                {order.actual_hours && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Actual Hours:</span>
                    <span className="text-gray-900">{order.actual_hours}h</span>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Created: {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              {user?.role === 'maintenance' && order.status !== 'Completed' && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  {order.status === 'Assigned' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'In Progress')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                    >
                      Start Work
                    </button>
                  )}
                  {order.status === 'In Progress' && (
                    <button
                      onClick={() => {
                        const hours = prompt('Enter actual hours worked:');
                        if (hours) {
                          handleStatusUpdate(order.id, 'Completed', parseFloat(hours));
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredWorkOrders.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'all' ? 'No work orders have been created yet.' : `No ${activeTab} work orders at the moment.`}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create Work Order</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign to Staff</label>
                  <select
                    required
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Staff Member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Flat</label>
                  <select
                    required
                    value={formData.flat_id}
                    onChange={(e) => setFormData({ ...formData, flat_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Flat</option>
                    {flats.map((flat) => (
                      <option key={flat.id} value={flat.id}>
                        {flat.flat_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Type</label>
                  <select
                    required
                    value={formData.work_type}
                    onChange={(e) => setFormData({ ...formData, work_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Work Type</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="gardening">Gardening</option>
                    <option value="security">Security</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe the work to be done..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Materials Needed</label>
                  <textarea
                    value={formData.materials_needed}
                    onChange={(e) => setFormData({ ...formData, materials_needed: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="List materials required for this work..."
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
                    Create Work Order
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

export default WorkOrders;