import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/navigation/BottomNav'
import { QuickActionButton } from '@/components/ui/QuickActionButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <main className="min-h-full">
          {children}
        </main>
      </div>

      <QuickActionButton />
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

