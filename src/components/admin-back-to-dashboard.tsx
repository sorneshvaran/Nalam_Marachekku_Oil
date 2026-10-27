import Link from 'next/link';

export default function AdminBackToDashboard() {
  return (
    <Link
      href="/admin"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700"
    >
      ← Back to Dashboard
    </Link>
  );
}