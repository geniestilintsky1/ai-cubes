import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Award, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { DashboardTable } from '@/components/DashboardTable';
import { fetchDashboardData, type SessionResult } from '@/lib/api';

const DashboardPage = () => {
  const [data, setData] = useState<SessionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const results = await fetchDashboardData();
        setData(results);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate stats
  const avgCvAccuracy = data.length > 0 
    ? data.reduce((sum, d) => sum + d.cvAccuracy, 0) / data.length 
    : 0;
  const avgRgbDelta = data.length > 0 
    ? data.reduce((sum, d) => sum + d.rgbDelta, 0) / data.length 
    : 0;
  const excellentPredictions = data.filter(d => d.rgbDelta < 30).length;

  const stats = [
    { 
      label: 'Total Sessions', 
      value: data.length, 
      icon: Users,
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Avg CV Accuracy', 
      value: `${avgCvAccuracy.toFixed(1)}%`, 
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent' 
    },
    { 
      label: 'Avg RGB Delta', 
      value: avgRgbDelta.toFixed(1), 
      icon: BarChart3,
      color: 'bg-warning/10 text-warning' 
    },
    { 
      label: 'Excellent Predictions', 
      value: excellentPredictions, 
      icon: Award,
      color: 'bg-accent/10 text-accent' 
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Teacher Dashboard
              </h1>
              <p className="text-muted-foreground">
                View and analyze student learning sessions
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div 
                key={label} 
                className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
                  {value}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading session data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-6">
                Student sessions will appear here once they complete the learning workflow.
              </p>
              <Button asChild>
                <Link to="/">Start a Session</Link>
              </Button>
            </div>
          ) : (
            <DashboardTable data={data} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
