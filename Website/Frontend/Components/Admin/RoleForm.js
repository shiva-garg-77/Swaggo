import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RBACService from '../../services/RBACService';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const RoleForm = () => {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const { permissions } = useFixedSecureAuth();
  const isEditMode = !!roleId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check if user has admin role
  const isAdmin = permissions?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    fetchData();
  }, [isAdmin, navigate, roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all permissions
      const perms = await RBACService.getPermissions();
      setPermissionsList(perms);
      
      // If editing, get role data
      if (isEditMode) {
        const role = await RBACService.getRoleById(roleId);
        setFormData({
          name: role.name,
          description: role.description,
          permissions: role.permissions || []
        });
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const index = permissions.indexOf(permissionId);
      
      if (index >= 0) {
        permissions.splice(index, 1);
      } else {
        permissions.push(permissionId);
      }
      
      return {
        ...prev,
        permissions
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      if (isEditMode) {
        await RBACService.updateRole(roleId, formData);
      } else {
        await RBACService.createRole(formData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/rbac');
      }, 1500);
    } catch (err) {
      setError('Failed to save role');
      console.error('Error saving role:', err);
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissionsList.reduce((groups, permission) => {
    const category = permission.id.split('_')[0] || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {});

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XMarkIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-1 text-gray-500">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/rbac')}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to RBAC
            </button>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Role' : 'Create Role'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditMode ? 'Modify an existing role' : 'Create a new role with specific permissions'}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Role {isEditMode ? 'updated' : 'created'} successfully!
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow sm:rounded-lg">
            <form onSubmit={handleSubmit}>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Role Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., Moderator"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Describe the purpose of this role"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto">
                      {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category} className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 capitalize mb-2">
                            {category} Permissions
                          </h4>
                          <div className="space-y-2">
                            {perms.map((permission) => (
                              <div key={permission.id} className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id={`permission-${permission.id}`}
                                    name={`permission-${permission.id}`}
                                    type="checkbox"
                                    checked={formData.permissions.includes(permission.id)}
                                    onChange={() => handlePermissionToggle(permission.id)}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor={`permission-${permission.id}`} className="font-medium text-gray-700">
                                    {permission.name}
                                  </label>
                                  <p className="text-gray-500">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/admin/rbac')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Role'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;