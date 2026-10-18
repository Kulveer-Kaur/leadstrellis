import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { SearchInput } from '@/components/ui';
import { PipelineBoard } from '@/features/pipeline/components/PipelineBoard';
import { useDebounce } from '@/hooks/useDebounce';

export default function PipelinePage() {
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Drag a lead to move it. Stages it can't move to fade out while you drag."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Find a lead…" className="w-full sm:w-72" />}
      />
      {error && (
        <p role="alert" className="mb-3 rounded-panel bg-danger-soft px-4 py-2 text-body-medium text-danger">
          {error}
        </p>
      )}
      <PipelineBoard search={useDebounce(search)} onError={setError} />
    </>
  );
}
