import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import {
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  BarChart3,
  Calendar,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import experimentsService, { Experiment, ExperimentFilters } from '@/services/experimentsService';

interface ExperimentsListProps {
  onCreateExperiment: () => void;
  onEditExperiment: (experiment: Experiment) => void;
  onViewAnalytics: (experiment: Experiment) => void;
}

export default function ExperimentsList({
  onCreateExperiment,
  onEditExperiment,
  onViewAnalytics,
}: ExperimentsListProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExperimentFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experimentToDelete, setExperimentToDelete] = useState<Experiment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExperiments();
  }, [filters]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const response = await experimentsService.getExperiments(filters);
      setExperiments(response.experiments);
      setPagination(response.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load experiments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setFilters(prev => ({ ...prev, status: status || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStartExperiment = async (experiment: Experiment) => {
    try {
      await experimentsService.startExperiment(experiment.id);
      toast({
        title: 'Success',
        description: `Experiment "${experiment.name}" started successfully`,
      });
      loadExperiments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start experiment',
        variant: 'destructive',
      });
    }
  };

  const handleStopExperiment = async (experiment: Experiment) => {
    try {
      await experimentsService.stopExperiment(experiment.id);
      toast({
        title: 'Success',
        description: `Experiment "${experiment.name}" stopped successfully`,
      });
      loadExperiments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop experiment',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateExperiment = async (experiment: Experiment) => {
    try {
      const newName = `${experiment.name} (Copy)`;
      await experimentsService.duplicateExperiment(experiment.id, newName);
      toast({
        title: 'Success',
        description: 'Experiment duplicated successfully',
      });
      loadExperiments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate experiment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExperiment = async () => {
    if (!experimentToDelete) return;

    try {
      await experimentsService.deleteExperiment(experimentToDelete.id);
      toast({
        title: 'Success',
        description: 'Experiment deleted successfully',
      });
      setDeleteDialogOpen(false);
      setExperimentToDelete(null);
      loadExperiments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete experiment',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const color = experimentsService.getStatusColor(status);
    const icon = experimentsService.getStatusIcon(status);
    
    return (
      <Badge variant={color as any} className="flex items-center gap-1">
        <span>{icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canStartExperiment = (experiment: Experiment) => {
    return experiment.status === 'draft' || experiment.status === 'paused';
  };

  const canStopExperiment = (experiment: Experiment) => {
    return experiment.status === 'active';
  };

  const canDeleteExperiment = (experiment: Experiment) => {
    return experiment.status === 'draft';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">A/B Testing Experiments</h1>
          <p className="text-muted-foreground">
            Manage and monitor your A/B testing experiments
          </p>
        </div>
        <Button onClick={onCreateExperiment} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Experiment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Experiments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Experiments ({pagination.totalRecords})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading experiments...</div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No experiments found</p>
              <Button onClick={onCreateExperiment}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first experiment
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experiments.map((experiment) => (
                    <TableRow key={experiment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{experiment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {experiment.description.length > 50
                              ? `${experiment.description.substring(0, 50)}...`
                              : experiment.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(experiment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {experiment.variants.length}
                        </div>
                      </TableCell>
                      <TableCell>{experiment.trafficAllocation}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {experimentsService.formatDuration(
                            experiment.startDate,
                            experiment.endDate
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(experiment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canStartExperiment(experiment) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartExperiment(experiment)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {canStopExperiment(experiment) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStopExperiment(experiment)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewAnalytics(experiment)}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => onEditExperiment(experiment)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateExperiment(experiment)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              {canDeleteExperiment(experiment) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setExperimentToDelete(experiment);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(pagination.current - 1)}
                        className={
                          pagination.current === 1 ? 'pointer-events-none opacity-50' : ''
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.total }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === pagination.current}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(pagination.current + 1)}
                        className={
                          pagination.current === pagination.total
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experiment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{experimentToDelete?.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExperiment} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 