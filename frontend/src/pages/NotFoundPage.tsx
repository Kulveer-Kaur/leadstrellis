import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <Card className="grid min-h-80 place-items-center text-center">
      <div>
        <p className="num text-display-small text-heading">404</p>
        <p className="mt-1 text-body-medium text-muted">This page does not exist.</p>
        <Link to="/" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-label-large text-on-primary">
          Back to dashboard
        </Link>
      </div>
    </Card>
  );
}
