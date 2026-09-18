import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, FileBarChart, PieChart, Download, Calendar, Tractor, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  const reports = [
    {
      title: "Daily Operations Summary",
      description: "Overview of all purchases, harvests, grouping, and dispatch activities for a given day.",
      icon: <Calendar className="h-6 w-6 text-blue-500" />,
      color: "border-l-blue-500"
    },
    {
      title: "Farm Yield & Follow-up Report",
      description: "Historical yield data per farm and upcoming 40-day harvest schedule.",
      icon: <Tractor className="h-6 w-6 text-green-500" />,
      color: "border-l-green-500"
    },
    {
      title: "Stock Movement Ledger",
      description: "Detailed traceability log of all godown stock additions and deductions.",
      icon: <FileBarChart className="h-6 w-6 text-amber-500" />,
      color: "border-l-amber-500"
    },
    {
      title: "Sales & Dispatch Reconciliation",
      description: "Match dispatched quantities against delivered quantities and billed amounts.",
      icon: <Truck className="h-6 w-6 text-purple-500" />,
      color: "border-l-purple-500"
    },
    {
      title: "Financial P&L Summary",
      description: "Revenue, COGS, expenses, and net profit margins over a specific period.",
      icon: <PieChart className="h-6 w-6 text-red-500" />,
      color: "border-l-red-500"
    },
    {
      title: "Accounts Aging Report",
      description: "Pending receivables and payables bucketed by age (0-30, 31-60, 60+ days).",
      icon: <FileText className="h-6 w-6 text-slate-500" />,
      color: "border-l-slate-500"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Generate and export business intelligence reports.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, idx) => (
          <Card key={idx} className={`border-l-4 ${report.color} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  {report.icon}
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-6 h-10 line-clamp-2">
                {report.description}
              </CardDescription>
              <div className="flex space-x-2">
                <Button variant="outline" className="w-full text-xs" size="sm">
                  <FileText className="mr-2 h-3 w-3" /> View Data
                </Button>
                <Button variant="secondary" className="w-full text-xs" size="sm">
                  <Download className="mr-2 h-3 w-3" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
