import { Download, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RgbSwatch } from '@/components/RgbSwatch';
import { cn } from '@/lib/utils';
import type { SessionResult } from '@/lib/api';

interface DashboardTableProps {
  data: SessionResult[];
  className?: string;
}

export function DashboardTable({ data, className }: DashboardTableProps) {
  const exportToCsv = () => {
    const headers = ['Student', 'Date', 'Robot X', 'Robot Y', 'Robot Z', 'CV Accuracy', 'Student RGB', 'AI RGB', 'RGB Delta'];
    const rows = data.map(row => [
      row.studentId,
      row.date.toLocaleDateString(),
      row.robotCoordinates.x,
      row.robotCoordinates.y,
      row.robotCoordinates.z,
      row.cvAccuracy.toFixed(1),
      `${row.studentRgb.r},${row.studentRgb.g},${row.studentRgb.b}`,
      `${row.aiRgb.r},${row.aiRgb.g},${row.aiRgb.b}`,
      row.rgbDelta.toFixed(1),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tangible-ai-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAccuracyColor = (value: number) => {
    if (value >= 90) return 'text-accent';
    if (value >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getDeltaColor = (value: number) => {
    if (value < 30) return 'text-accent';
    if (value < 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Student Results</h3>
          <p className="text-sm text-muted-foreground">{data.length} sessions recorded</p>
        </div>
        <Button variant="outline" onClick={exportToCsv}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Student
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Robot Position</TableHead>
              <TableHead className="text-center">CV Accuracy</TableHead>
              <TableHead className="text-center">Student Color</TableHead>
              <TableHead className="text-center">AI Color</TableHead>
              <TableHead className="text-center">RGB Delta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{row.studentId}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.date.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 text-xs font-mono">
                    <span className="text-destructive">X:{row.robotCoordinates.x}</span>
                    <span className="text-accent">Y:{row.robotCoordinates.y}</span>
                    <span className="text-primary">Z:{row.robotCoordinates.z}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn("font-semibold", getAccuracyColor(row.cvAccuracy))}>
                    {row.cvAccuracy.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <RgbSwatch rgb={row.studentRgb} showValues={false} size="sm" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <RgbSwatch rgb={row.aiRgb} showValues={false} size="sm" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn("font-semibold font-mono", getDeltaColor(row.rgbDelta))}>
                    {row.rgbDelta.toFixed(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
