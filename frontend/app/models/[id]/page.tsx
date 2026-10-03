import ModelDetailClient from './ModelDetailClient';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

export default function ModelDetailPage() {
  return <ModelDetailClient />;
}
