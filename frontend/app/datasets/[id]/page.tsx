import DatasetDetailClient from './DatasetDetailClient';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

export default function DatasetDetailPage() {
  return <DatasetDetailClient />;
}
