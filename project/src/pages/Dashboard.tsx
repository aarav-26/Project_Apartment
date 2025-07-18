import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../utils/api';
import { Building2, Users, Wrench, MessageSquare, DollarSign, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  flats: {
    total_flats: number;
    occupied_flats: number;
    vacant_flats: number;
  };
  maintenance: {
    pending_amount: number;
    collected_amount: number;
    pending_count: number;
  };
  complaints: {
    total_complaints: number;
    pending_complaints: number;
    resolved_complaints: number;
  };
  recentComplaints: Array<{
    title: string;
    status: string;
    created_at: string;
    flat_number: string;
  }>;
  recentVisitors: Array<{
    visitor_name: string;
    time_in: string;
    flat_number: string;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'in progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.username}!</p>
      </div>

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Flats</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stats.flats.total_flats}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                  <span>Occupied: {stats.flats.occupied_flats}</span>
                  <span>Vacant: {stats.flats.vacant_flats}</span>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Monthly Income</dt>
                      <dd className="text-2xl font-bold text-gray-900">₹{stats.maintenance.collected_amount?.toLocaleString() || 0}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Pending: ₹{stats.maintenance.pending_amount?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Complaints</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stats.complaints.total_complaints}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm text-gray-600">
                  <span>Pending: {stats.complaints.pending_complaints}</span>
                  <span>Resolved: {stats.complaints.resolved_complaints}</span>
                </div>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Dues</dt>
                        <dd className="text-2xl font-bold text-gray-900">{stats.maintenance.pending_count}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Amount: ₹{stats.maintenance.pending_amount?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Occupancy Rate</dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {Math.round((stats.flats.occupied_flats / stats.flats.total_flats) * 100)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Complaints</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentComplaints.length > 0 ? (
                  stats.recentComplaints.map((complaint, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{complaint.title}</p>
                          <p className="text-sm text-gray-500">Flat {complaint.flat_number}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">No recent complaints</div>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Visitors</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentVisitors.length > 0 ? (
                  stats.recentVisitors.map((visitor, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{visitor.visitor_name}</p>
                          <p className="text-sm text-gray-500">Visited Flat {visitor.flat_number}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(visitor.time_in).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">No recent visitors</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;