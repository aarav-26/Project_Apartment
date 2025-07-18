import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { flatAPI } from '../utils/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Flat {
  id: number;
  flat_number: string;
  owner_name: string;
  owner_contact: string;
  current_tenant: string;
  tenant_contact: string;
  occupancy_status: 'Owner-occupied' | 'Tenant-occupied' | 'Vacant';
  vehicle_info: string;
  monthly_rent: number;
  created_at: string;
}

const Flats: React.FC = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    flat_number: '',
    owner_name: '',
    owner_contact: '',
    current_tenant: '',
    tenant_contact: '',
    occupancy_status: 'Vacant' as 'Owner-occupied' | 'Tenant-occupied' | 'Vacant',
    vehicle_info: '',
    monthly_rent: 0
  });

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = async () => {
    try {
      const response = await flatAPI.getAll();
      setFlats(response.data);
    } catch (error) {
      console.error('Error fetching flats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFlat) {
        await flatAPI.update(editingFlat.id, formData);
      } else {
        await flatAPI.create(formData);
      }
      setShowModal(false);
      setEditingFlat(null);
      resetForm();
      fetchFlats();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving flat');
    }
  };

  const handleEdit = (flat: Flat) => {
    setEditingFlat(flat);
    setFormData({
      flat_number: flat.flat_number,
      owner_name: flat.owner_name,
      owner_contact: flat.owner_contact || '',
      current_tenant: flat.current_tenant || '',
      tenant_contact: flat.tenant_contact || '',
      occupancy_status: flat.occupancy_status,
      vehicle_info: flat.vehicle_info || '',
      monthly_rent: flat.monthly_rent
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this flat?')) {
      try {
        await flatAPI.delete(id);
        fetchFlats();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error deleting flat');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      flat_number: '',
      owner_name: '',
      owner_contact: '',
      current_tenant: '',
      tenant_contact: '',
      occupancy_status: 'Vacant',
      vehicle_info: '',
      monthly_rent: 0
    });
  };

  const filteredFlats = flats.filter(flat =>
    flat.flat_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flat.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flat.current_tenant && flat.current_tenant.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Owner-occupied': return 'bg-blue-100 text-blue-800';
      case 'Tenant-occupied': return 'bg-green-100 text-green-800';
      case 'Vacant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Flats Management</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Flat</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search flats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Flats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFlats.map((flat) => (
          <div key={flat.id} className="bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Flat {flat.flat_number}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flat.occupancy_status)}`}>
                  {flat.occupancy_status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Owner:</span> {flat.owner_name}
                </div>
                {flat.owner_contact && (
                  <div>
                    <span className="font-medium">Owner Contact:</span> {flat.owner_contact}
                  </div>
                )}
                {flat.current_tenant && (
                  <div>
                    <span className="font-medium">Tenant:</span> {flat.current_tenant}
                  </div>
                )}
                {flat.tenant_contact && (
                  <div>
                    <span className="font-medium">Tenant Contact:</span> {flat.tenant_contact}
                  </div>
                )}
                {flat.vehicle_info && (
                  <div>
                    <span className="font-medium">Vehicle:</span> {flat.vehicle_info}
                  </div>
                )}
                {flat.monthly_rent > 0 && (
                  <div>
                    <span className="font-medium">Monthly Rent:</span> ₹{flat.monthly_rent.toLocaleString()}
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(flat)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(flat.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingFlat ? 'Edit Flat' : 'Add New Flat'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Flat Number</label>
                  <input
                    type="text"
                    required
                    value={formData.flat_number}
                    onChange={(e) => setFormData({ ...formData, flat_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner Contact</label>
                  <input
                    type="tel"
                    value={formData.owner_contact}
                    onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Occupancy Status</label>
                  <select
                    value={formData.occupancy_status}
                    onChange={(e) => setFormData({ ...formData, occupancy_status: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Owner-occupied">Owner-occupied</option>
                    <option value="Tenant-occupied">Tenant-occupied</option>
                  </select>
                </div>

                {formData.occupancy_status === 'Tenant-occupied' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Tenant</label>
                      <input
                        type="text"
                        value={formData.current_tenant}
                        onChange={(e) => setFormData({ ...formData, current_tenant: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tenant Contact</label>
                      <input
                        type="tel"
                        value={formData.tenant_contact}
                        onChange={(e) => setFormData({ ...formData, tenant_contact: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                      <input
                        type="number"
                        value={formData.monthly_rent}
                        onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Info</label>
                  <textarea
                    value={formData.vehicle_info}
                    onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Car: MH01AB1234, Bike: MH01CD5678"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingFlat(null);
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
                    {editingFlat ? 'Update' : 'Create'}
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

export default Flats;