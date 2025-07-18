import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { residentAPI, flatAPI } from '../utils/api';
import { Plus, Edit2, Trash2, Upload, Download } from 'lucide-react';

interface Resident {
  id: number;
  flat_id: number;
  name: string;
  email: string;
  contact: string;
  id_proof_type: string;
  id_proof_number: string;
  id_proof_document: string;
  vehicle_info: string;
  is_owner: boolean;
  flat_number: string;
  created_at: string;
}

interface Flat {
  id: number;
  flat_number: string;
}

const Residents: React.FC = () => {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState({
    flat_id: '',
    name: '',
    email: '',
    contact: '',
    id_proof_type: '',
    id_proof_number: '',
    id_proof_document: '',
    vehicle_info: '',
    is_owner: false
  });

  useEffect(() => {
    fetchResidents();
    fetchFlats();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await residentAPI.getAll();
      setResidents(response.data);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, id_proof_document: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        flat_id: parseInt(formData.flat_id)
      };

      if (editingResident) {
        await residentAPI.update(editingResident.id, submitData);
      } else {
        await residentAPI.create(submitData);
      }
      setShowModal(false);
      setEditingResident(null);
      resetForm();
      fetchResidents();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving resident');
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      flat_id: resident.flat_id.toString(),
      name: resident.name,
      email: resident.email || '',
      contact: resident.contact || '',
      id_proof_type: resident.id_proof_type || '',
      id_proof_number: resident.id_proof_number || '',
      id_proof_document: resident.id_proof_document || '',
      vehicle_info: resident.vehicle_info || '',
      is_owner: resident.is_owner
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this resident?')) {
      try {
        await residentAPI.delete(id);
        fetchResidents();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error deleting resident');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      flat_id: '',
      name: '',
      email: '',
      contact: '',
      id_proof_type: '',
      id_proof_number: '',
      id_proof_document: '',
      vehicle_info: '',
      is_owner: false
    });
  };

  const downloadDocument = (base64Data: string, filename: string) => {
    if (base64Data) {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        <h1 className="text-3xl font-bold text-gray-900">Residents Management</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Resident</span>
          </button>
        )}
      </div>

      {/* Residents Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Proof
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {residents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{resident.name}</div>
                      {resident.email && (
                        <div className="text-sm text-gray-500">{resident.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{resident.flat_number}</span>
                      {resident.is_owner && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Owner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resident.contact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{resident.id_proof_type}</div>
                    <div className="text-sm text-gray-500">{resident.id_proof_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {resident.is_owner ? 'Owner' : 'Tenant'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {resident.id_proof_document && (
                      <button
                        onClick={() => downloadDocument(
                          resident.id_proof_document,
                          `${resident.name}_id_proof.pdf`
                        )}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors duration-200"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    )}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(resident)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(resident.id)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingResident ? 'Edit Resident' : 'Add New Resident'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact</label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Proof Type</label>
                  <select
                    value={formData.id_proof_type}
                    onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select ID Type</option>
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Proof Number</label>
                  <input
                    type="text"
                    value={formData.id_proof_number}
                    onChange={(e) => setFormData({ ...formData, id_proof_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Proof Document</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {formData.id_proof_document && (
                    <p className="text-sm text-green-600 mt-1">Document uploaded</p>
                  )}
                </div>

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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_owner"
                    checked={formData.is_owner}
                    onChange={(e) => setFormData({ ...formData, is_owner: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_owner" className="ml-2 block text-sm text-gray-900">
                    Is Owner
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingResident(null);
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
                    {editingResident ? 'Update' : 'Create'}
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

export default Residents;