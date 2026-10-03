import InferenceDetailClient from './InferenceDetailClient';

export function generateStaticParams() {
  return [{ id: 'sample' }];
}

export default function InferenceDetailPage() {
  return <InferenceDetailClient />;
}
