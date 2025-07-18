import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintAPI, flatAPI, contactAPI } from '../utils/api';
import { Plus, Clock, AlertTriangle, CheckCircle, Mail } from 'lucide-react';

interface Complaint {
  id: number;
  flat_id: number;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  created_by: string;
  assigned_to: string;
  flat_number: string;
  created_at: string;
  updated_at: string;
}

interface Flat {
  id: number;
  flat_number: string;
}

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  created_at: string;
}

const Complaints: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'resolved' | 'inquiries'>('all');

  const [formData, setFormData] = useState({
    flat_id: '',
    title: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High'
  });

  useEffect(() => {
    fetchComplaints();
    fetchFlats();
    if (user?.role === 'admin') fetchInquiries();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await complaintAPI.getAll();
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await contactAPI.getInquiries(); // ✅ Fixed here
      setInquiries(response.data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
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
        flat_id: parseInt(formData.flat_id)
      };

      await complaintAPI.create(submitData);
      setShowModal(false);
      resetForm();
      fetchComplaints();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating complaint');
    }
  };

  const handleStatusUpdate = async (id: number, status: string, assigned_to?: string) => {
    try {
      await complaintAPI.updateStatus(id, { status, assigned_to });
      fetchComplaints();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating complaint');
    }
  };

  const resetForm = () => {
    setFormData({
      flat_id: '',
      title: '',
      description: '',
      priority: 'Medium'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
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

  const filteredComplaints = complaints.filter(complaint => {
    switch (activeTab) {
      case 'pending': return complaint.status === 'Pending';
      case 'in-progress': return complaint.status === 'In Progress';
      case 'resolved': return complaint.status === 'Resolved';
      default: return true;
    }
  });

  const showComplaintsTab = activeTab !== 'inquiries';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>
        {showComplaintsTab && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Complaint</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Complaints' },
            { key: 'pending', label: 'Pending' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'resolved', label: 'Resolved' },
            ...(user?.role === 'admin' ? [{ key: 'inquiries', label: 'Inquiries' }] : [])
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

      {showComplaintsTab ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((complaint) => (
            <div key={complaint.id} className="bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(complaint.status)}
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{complaint.title}</h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-500">Flat:</span>
                    <span className="font-medium text-gray-900 ml-2">{complaint.flat_number}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Created by:</span>
                    <span className="text-gray-900 ml-2">{complaint.created_by}</span>
                  </div>
                  <div className="text-sm text-gray-500">Created: {new Date(complaint.created_at).toLocaleDateString()}</div>
                </div>

                {(user?.role === 'admin' || user?.role === 'maintenance') && complaint.status !== 'Resolved' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    {complaint.status === 'Pending' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'In Progress', user.username)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                      >
                        Start Working
                      </button>
                    )}
                    {complaint.status === 'In Progress' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'Resolved')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white shadow-sm rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">{inq.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{inq.email} • {inq.phone}</p>
              <p className="mt-2 text-sm text-gray-700"><strong>Type:</strong> {inq.inquiry_type}</p>
              <p className="mt-1 text-gray-800">{inq.message}</p>
              <p className="mt-2 text-xs text-gray-400">Received: {new Date(inq.created_at).toLocaleString()}</p>
            </div>
          ))}
          {inquiries.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inquiries found</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Complaints;
