import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RBACService from '../../services/RBACService';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  ShieldCheckIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const UserRoleManagement = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { permissions } = useFixedSecureAuth();

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
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
  }, [isAdmin, navigate, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all roles
      const rolesData = await RBACService.getRoles();
      setRoles(rolesData);
      
      // Get user details and roles
      // In a real implementation, you would fetch user details from a user service
      // For now, we'll simulate this
      const userRolesData = await RBACService.getUserRoles(userId);
      setUserRoles(userRolesData);
      
      // Simulate user data
      setUser({
        id: userId,
        username: 'user@example.com',
        email: 'user@example.com'
      });
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (roleId) => {
    try {
      setAssigning(true);
      setError(null);
      
      await RBACService.assignRoleToUser(userId, roleId);
      
      // Refresh user roles
      const userRolesData = await RBACService.getUserRoles(userId);
      setUserRoles(userRolesData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to assign role');
      console.error('Error assigning role:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (window.confirm('Are you sure you want to remove this role from the user?')) {
      try {
        await RBACService.removeRoleFromUser(userId, roleId);
        
        // Refresh user roles
        const userRolesData = await RBACService.getUserRoles(userId);
        setUserRoles(userRolesData);
      } catch (err) {
        setError('Failed to remove role');
        console.error('Error removing role:', err);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-500" />
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
              Manage User Roles
            </h1>
            <p className="mt-2 text-gray-600">
              Assign or remove roles for user: {user?.username}
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
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
                    Role assigned successfully!
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {user?.username}
                  </h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Current Roles</h3>
              {userRoles.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {userRoles.map((role) => (
                    <div key={role.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400">
                      <div className="flex-shrink-0">
                        <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        <p className="text-sm text-gray-500 truncate">{role.description}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveRole(role.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">This user has no assigned roles.</p>
              )}
            </div>
            
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Roles</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {roles
                  .filter(role => !userRoles.some(userRole => userRole.id === role.id))
                  .map((role) => (
                    <div key={role.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400">
                      <div className="flex-shrink-0">
                        <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        <p className="text-sm text-gray-500 truncate">{role.description}</p>
                      </div>
                      <button
                        onClick={() => handleAssignRole(role.id)}
                        disabled={assigning}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {assigning ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Assigning...
                          </>
                        ) : (
                          'Assign'
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleManagement;