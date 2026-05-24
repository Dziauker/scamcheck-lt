import Header from '@/components/Header'
import ResultDisplay from '@/components/ResultDisplay'

interface PageProps {
  params: { caseId: string }
}

export default function ResultPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-paper">
      {/* FIX H4: show back link in header */}
      <Header showBack />
      <ResultDisplay caseId={params.caseId} />
    </div>
  )
}
