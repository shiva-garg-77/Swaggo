'use client'

import { useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client/react';
import { ArrowLeft, UserMinus, Trash2 } from 'lucide-react'
import { useSecureAuth } from '../../../context/FixedSecureAuthContext'
import { GET_BLOCKED_ACCOUNTS, UNBLOCK_USER } from '../../../lib/graphql/profileQueries'

export default function BlockedAccounts({ onBack }) {
  const { user } = useSecureAuth()
  const profileid = user?.profileid

  const { data, loading, error, refetch } = useQuery(GET_BLOCKED_ACCOUNTS, {
    variables: { profileid },
    skip: !profileid,
    fetchPolicy: 'cache-and-network'
  })

  const [unblockUser, { loading: unblocking }] = useMutation(UNBLOCK_USER, {
    onCompleted: () => refetch()
  })

  const blocked = useMemo(() => data?.getBlockedAccounts ?? [], [data])

  const handleUnblock = async (targetprofileid) => {
    if (!profileid) return
    try {
      await unblockUser({ variables: { profileid, targetprofileid } })
    } catch (e) {
      console.error('Unblock failed', e)
      alert('Failed to unblock. Please try again.')
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
                <UserMinus className="w-6 h-6" /> Blocked Accounts
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">People you’ve blocked</h2>

          {loading && <p className="text-gray-500 dark:text-gray-400">Loading…</p>}
          {error && <p className="text-red-500">Failed to load: {error.message}</p>}

          {!loading && blocked.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No blocked accounts yet.</p>
          )}

          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {blocked.map((b) => (
              <li key={b.blockid} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={b.blockedProfile?.profilePic} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.blockedProfile?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{b.blockedProfile?.name}</p>
                  </div>
                </div>
                <button
                  disabled={unblocking}
                  onClick={() => handleUnblock(b.blockedProfile?.profileid)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" /> Unblock
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
