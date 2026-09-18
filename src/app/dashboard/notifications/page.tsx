import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, AlertTriangle, Info, CheckCircle2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'info': return <Info className="h-5 w-5 text-blue-500" />
      default: return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const getBgClass = (type: string, read: boolean) => {
    if (read) return 'bg-white border-slate-100'
    switch (type) {
      case 'alert': return 'bg-red-50/50 border-red-100'
      case 'warning': return 'bg-amber-50/50 border-amber-100'
      case 'success': return 'bg-green-50/50 border-green-100'
      case 'info': return 'bg-blue-50/50 border-blue-100'
      default: return 'bg-slate-50 border-slate-100'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            System alerts and business event notifications.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input placeholder="Search notifications..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {(notifications || []).map((note: any) => (
              <div 
                key={note.id} 
                className={`p-4 flex gap-4 items-start transition-colors hover:bg-slate-50 ${getBgClass(note.type, note.read)}`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(note.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${note.read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {note.title}
                    </p>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {note.time}
                    </span>
                  </div>
                  <p className={`text-sm ${note.read ? 'text-slate-500' : 'text-slate-700'}`}>
                    {note.message}
                  </p>
                </div>
                {!note.read && (
                  <div className="flex-shrink-0 mt-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center mt-6">
        <Button variant="ghost" className="text-slate-500">
          Load Older Notifications
        </Button>
      </div>
    </div>
  )
}
