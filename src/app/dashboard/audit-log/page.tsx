import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { History, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'

export default async function AuditLogPage() {
  const supabase = await createClient()
  
  // Fetch audit logs
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const hasLogs = Boolean(!error && logs && logs.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Audit Log</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System-wide security and action tracking.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search"
            placeholder="Search logs by action, table, or user..." 
            className="w-full pl-9 h-11 text-base sm:text-sm rounded-lg border-slate-200 dark:border-slate-800" 
          />
        </div>
        <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[36px]">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
      </div>

      {!hasLogs ? (
        <EmptyState
          icon={History}
          title="No audit logs recorded"
          description="Audit logs are automatically created as team members perform operations across the system."
        />
      ) : (
        <>
          {/* Mobile Stacked Cards (<768px) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {logs!.map((log: any) => (
              <div 
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                      log.action === 'INSERT' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{log.table_name}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Record ID:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{log.record_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">User:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}</span>
                  </div>
                  {log.ip_address && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{log.ip_address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=768px) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Record ID</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs!.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono" title={log.user_id}>
                      {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                        log.action === 'INSERT' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{log.table_name}</td>
                    <td className="px-4 py-3 text-xs font-mono">{log.record_id}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
