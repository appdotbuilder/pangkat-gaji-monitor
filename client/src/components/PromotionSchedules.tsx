import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, DollarSign, TrendingUp, Edit, Trash2, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
// Proper relative path calculation: from components/ up to client/, then up to root, then down to server/
import type { PromotionSchedule, Employee, UpdatePromotionScheduleInput } from '../../../server/src/schema';

interface PromotionSchedulesProps {
  schedules: PromotionSchedule[];
  employees: Employee[];
  onRefresh: () => void;
  onUpcomingRefresh: () => void;
}

interface EditPromotionDialogProps {
  schedule: PromotionSchedule;
  employee: Employee | undefined;
  onUpdate: (id: number) => void;
}

function EditPromotionDialog({ schedule, employee, onUpdate }: EditPromotionDialogProps) {
  const [formData, setFormData] = useState<UpdatePromotionScheduleInput>({
    id: schedule.id,
    target_position: schedule.target_position,
    target_salary: schedule.target_salary,
    scheduled_date: schedule.scheduled_date,
    status: schedule.status,
    notes: schedule.notes
  });
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updatePromotionSchedule.mutate(formData);
      onUpdate(schedule.id);
      setOpen(false);
    } catch (error) {
      console.error('Failed to update promotion schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Promotion Schedule</DialogTitle>
          <DialogDescription>
            Update promotion details for {employee?.name || 'Unknown Employee'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="target_position">Target Position</Label>
            <Input
              id="target_position"
              value={formData.target_position || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdatePromotionScheduleInput) => ({ 
                  ...prev, 
                  target_position: e.target.value 
                }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="target_salary">Target Salary</Label>
            <Input
              id="target_salary"
              type="number"
              value={formData.target_salary || 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdatePromotionScheduleInput) => ({ 
                  ...prev, 
                  target_salary: parseFloat(e.target.value) || 0 
                }))
              }
              min="0"
              step="1000"
              required
            />
          </div>

          <div>
            <Label htmlFor="scheduled_date">Scheduled Date</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={formData.scheduled_date ? formData.scheduled_date.toISOString().split('T')[0] : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdatePromotionScheduleInput) => ({ 
                  ...prev, 
                  scheduled_date: new Date(e.target.value)
                }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status || 'pending'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData((prev: UpdatePromotionScheduleInput) => ({ 
                  ...prev, 
                  status: e.target.value as 'pending' | 'approved' | 'completed' | 'cancelled'
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: UpdatePromotionScheduleInput) => ({ 
                  ...prev, 
                  notes: e.target.value || null
                }))
              }
              placeholder="Add any notes about this promotion..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PromotionSchedules({ schedules, employees, onRefresh, onUpcomingRefresh }: PromotionSchedulesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Create a map for quick employee lookup
  const employeeMap = new Map(employees.map((emp: Employee) => [emp.id, emp]));

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule: PromotionSchedule) => {
    const employee = employeeMap.get(schedule.employee_id);
    const matchesSearch = employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.current_position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.target_position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || schedule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort schedules by scheduled date (most recent first)
  const sortedSchedules = [...filteredSchedules].sort((a: PromotionSchedule, b: PromotionSchedule) => 
    b.scheduled_date.getTime() - a.scheduled_date.getTime()
  );

  const handleUpdate = async (id: number) => {
    onRefresh();
    onUpcomingRefresh();
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">No promotion schedules</p>
        <p className="text-sm">Schedule your first promotion to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="🔍 Search by employee, position..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-800">
            {schedules.filter(s => s.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-800">
            {schedules.filter(s => s.status === 'approved').length}
          </div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-800">
            {schedules.filter(s => s.status === 'completed').length}
          </div>
          <div className="text-sm text-blue-600">Completed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-800">
            {schedules.filter(s => s.status === 'cancelled').length}
          </div>
          <div className="text-sm text-red-600">Cancelled</div>
        </div>
      </div>

      {/* Schedules List */}
      {sortedSchedules.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No schedules match your filters</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSchedules.map((schedule: PromotionSchedule) => {
            const employee = employeeMap.get(schedule.employee_id);
            const salaryIncrease = schedule.target_salary - schedule.current_salary;
            const increasePercentage = ((salaryIncrease / schedule.current_salary) * 100).toFixed(1);

            return (
              <Card key={schedule.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-2 rounded-full">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {employee?.name || 'Unknown Employee'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {schedule.current_position} → {schedule.target_position}
                          </p>
                        </div>
                        {getStatusBadge(schedule.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium">Scheduled</span>
                            <p className="text-sm text-gray-600">
                              {schedule.scheduled_date.toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <span className="text-sm font-medium">Salary Change</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-gray-600">
                                ${schedule.current_salary.toLocaleString()}
                              </span>
                              <span className="text-xs">→</span>
                              <span className="text-sm font-semibold text-green-600">
                                ${schedule.target_salary.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-green-600">
                              +${salaryIncrease.toLocaleString()} ({increasePercentage}%)
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium">Created</span>
                          <p className="text-sm text-gray-600">
                            {schedule.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {schedule.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">{schedule.notes}</p>
                        </div>
                      )}

                      {employee && (
                        <div className="text-sm text-gray-600">
                          <p>Department: {employee.department} | ID: {employee.employee_id}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <EditPromotionDialog 
                        schedule={schedule} 
                        employee={employee}
                        onUpdate={handleUpdate}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}