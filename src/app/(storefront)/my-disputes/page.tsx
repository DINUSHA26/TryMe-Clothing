import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { tokenUtils } from '@/lib/auth';
import { getServerAppUrl } from '@/lib/server-env';
import { DisputeCard } from '@/components/disputes/DisputeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search, FileQuestion } from 'lucide-react';
import { DISPUTE_STATUS_LABELS } from '@/types/dispute';

interface MyDisputesPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

async function getDisputes(filters: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', filters.page);

  const appUrl = await getServerAppUrl();
  const response = await fetch(
    `${appUrl}/api/disputes?${params.toString()}`,
    {
      headers: {
        Cookie: `accessToken=${token}`,
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function MyDisputesPage({
  searchParams,
}: MyDisputesPageProps) {
  const resolvedParams = await searchParams;

  // Verify authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await tokenUtils.verifyAccessToken(token);
  if (!payload) {
    redirect('/login');
  }

  // Fetch disputes
  const result = await getDisputes(resolvedParams);

  if (!result || !result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">Failed to load disputes</p>
        </div>
      </div>
    );
  }

  const { data: disputes, pagination, stats } = result;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Disputes</h1>
        <p className="text-muted-foreground">
          View and manage your order disputes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-500 text-shadow-sm">
              {stats.inReview}
            </div>
            <p className="text-xs text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.resolvedCustomerFavor}</div>
            <p className="text-xs text-muted-foreground">Won</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-500">
              {stats.closed}
            </div>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/my-disputes">
          <Button variant={!resolvedParams.status ? 'default' : 'outline'} size="sm">
            All
          </Button>
        </Link>
        {Object.entries(DISPUTE_STATUS_LABELS).map(([key, label]) => (
          <Link key={key} href={`/my-disputes?status=${key}`}>
            <Button
              variant={resolvedParams.status === key ? 'default' : 'outline'}
              size="sm"
            >
              {label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form method="get" className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search disputes..."
              defaultValue={resolvedParams.search}
              className="pl-10"
            />
          </form>
        </CardContent>
      </Card>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No disputes found</h3>
              <p className="text-muted-foreground">
                {resolvedParams.status || resolvedParams.search
                  ? 'Try adjusting your filters'
                  : "You haven't opened any disputes yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 mb-6">
            {disputes.map((dispute: any) => (
              <DisputeCard key={dispute.id} dispute={dispute} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <a
                      href={`?${new URLSearchParams({
                        ...resolvedParams,
                        page: page.toString(),
                      }).toString()}`}
                    >
                      {page}
                    </a>
                  </Button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
