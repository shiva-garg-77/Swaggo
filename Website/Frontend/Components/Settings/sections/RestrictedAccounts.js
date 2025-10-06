'use client'

import { useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react';
import { ArrowLeft, UserX, Trash2 } from 'lucide-react'
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import { GET_RESTRICTED_ACCOUNTS, UNRESTRICT_USER } from '../../../lib/graphql/profileQueries'

export default function RestrictedAccounts({ onBack }) {
  const { user } = useSecureAuth()
  const profileid = user?.profileid

  const { data, loading, error, refetch } = useQuery(GET_RESTRICTED_ACCOUNTS, {
    variables: { profileid },
    skip: !profileid,
    fetchPolicy: 'cache-and-network'
  })

  const [unrestrictUser, { loading: unrestricting }] = useMutation(UNRESTRICT_USER, {
    onCompleted: () => refetch()
  })

  const restricted = useMemo(() => data?.getRestrictedAccounts ?? [], [data])

  const handleUnrestrict = async (targetprofileid) => {
    if (!profileid) return
    try {
      await unrestrictUser({ variables: { profileid, targetprofileid } })
    } catch (e) {
      console.error('Unrestrict failed', e)
      alert('Failed to unrestrict. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-3">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserX className="w-6 h-6" /> Restricted Accounts
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">People you’ve restricted</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Restricted accounts can see your posts and stories, but their comments and direct messages will only be visible to them unless you approve them.
          </p>

          {loading && <p className="text-gray-500 dark:text-gray-400">Loading…</p>}
          {error && <p className="text-red-500">Failed to load: {error.message}</p>}

          {!loading && restricted.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No restricted accounts yet.</p>
          )}

          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {restricted.map((r) => (
              <li key={r.restrictid} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={r.restrictedProfile?.profilePic} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{r.restrictedProfile?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.restrictedProfile?.name}</p>
                  </div>
                </div>
                <button
                  disabled={unrestricting}
                  onClick={() => handleUnrestrict(r.restrictedProfile?.profileid)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
