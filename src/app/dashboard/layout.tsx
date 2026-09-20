import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/navigation/TopBar'
import { BottomNav } from '@/components/navigation/BottomNav'
import { QuickAccessFab } from '@/components/navigation/QuickAccessFab'

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
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-950 antialiased selection:bg-primary/20">
      {/* Android Mobile Native Top App Bar */}
      <TopBar />

      {/* Main Scrollable Content Area */}
      <div className="flex-1 w-full scroll-container">
        <main className="w-full max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-4 pb-32 sm:px-6 sm:pb-24">
          {children}
        </main>
      </div>

      {/* Quick Access (+) FAB */}
      <QuickAccessFab />
      
      {/* Android Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
