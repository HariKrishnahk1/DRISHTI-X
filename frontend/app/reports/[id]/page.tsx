import ReportDetailClient from './ReportDetailClient';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

export default function ReportDetailPage() {
  return <ReportDetailClient />;
}
