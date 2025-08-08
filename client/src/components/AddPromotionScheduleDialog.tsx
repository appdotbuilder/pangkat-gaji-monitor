import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
// Proper relative path calculation: from components/ up to client/, then up to root, then down to server/
import type { CreatePromotionScheduleInput, PromotionSchedule, Employee } from '../../../server/src/schema';

interface AddPromotionScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onPromotionScheduleAdded: (schedule: PromotionSchedule) => void;
}

export function AddPromotionScheduleDialog({ 
  open, 
  onOpenChange, 
  employees,
  onPromotionScheduleAdded 
}: AddPromotionScheduleDialogProps) {
  const [formData, setFormData] = useState<CreatePromotionScheduleInput>({
    employee_id: 0,
    current_position: '',
    target_position: '',
    current_salary: 0,
    target_salary: 0,
    scheduled_date: new Date(),
    status: 'pending',
    notes: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill employee data when employee is selected
  const handleEmployeeChange = (employeeId: number) => {
    const employee = employees.find((emp: Employee) => emp.id === employeeId);
    if (employee) {
      setFormData((prev: CreatePromotionScheduleInput) => ({
        ...prev,
        employee_id: employeeId,
        current_position: employee.position
      }));
    } else {
      setFormData((prev: CreatePromotionScheduleInput) => ({
        ...prev,
        employee_id: employeeId,
        current_position: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newSchedule = await trpc.createPromotionSchedule.mutate(formData);
      onPromotionScheduleAdded(newSchedule);
      
      // Reset form
      setFormData({
        employee_id: 0,
        current_position: '',
        target_position: '',
        current_salary: 0,
        target_salary: 0,
        scheduled_date: new Date(),
        status: 'pending',
        notes: null
      });
    } catch (error) {
      console.error('Failed to create promotion schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  // Calculate salary increase percentage
  const salaryIncrease = formData.target_salary - formData.current_salary;
  const increasePercentage = formData.current_salary > 0 
    ? ((salaryIncrease / formData.current_salary) * 100).toFixed(1) 
    : '0.0';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">📈 Schedule Promotion</DialogTitle>
          <DialogDescription>
            Create a new promotion schedule for an employee
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Employee *</Label>
            <select
              id="employee"
              value={formData.employee_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleEmployeeChange(parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Select an employee</option>
              {employees.map((employee: Employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.position} ({employee.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_position">Current Position *</Label>
              <Input
                id="current_position"
                value={formData.current_position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePromotionScheduleInput) => ({ 
                    ...prev, 
                    current_position: e.target.value 
                  }))
                }
                placeholder="Software Engineer"
                required
              />
            </div>

            <div>
              <Label htmlFor="target_position">Target Position *</Label>
              <Input
                id="target_position"
                value={formData.target_position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePromotionScheduleInput) => ({ 
                    ...prev, 
                    target_position: e.target.value 
                  }))
                }
                placeholder="Senior Software Engineer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_salary">Current Salary *</Label>
              <Input
                id="current_salary"
                type="number"
                value={formData.current_salary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePromotionScheduleInput) => ({ 
                    ...prev, 
                    current_salary: parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="75000"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <Label htmlFor="target_salary">Target Salary *</Label>
              <Input
                id="target_salary"
                type="number"
                value={formData.target_salary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePromotionScheduleInput) => ({ 
                    ...prev, 
                    target_salary: parseFloat(e.target.value) || 0
                  }))
                }
                placeholder="85000"
                min="0"
                step="1000"
                required
              />
            </div>
          </div>

          {/* Salary increase preview */}
          {formData.current_salary > 0 && formData.target_salary > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                💰 Salary Increase: ${salaryIncrease.toLocaleString()} ({increasePercentage}%)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_date">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreatePromotionScheduleInput) => ({ 
                    ...prev, 
                    scheduled_date: new Date(e.target.value)
                  }))
                }
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData((prev: CreatePromotionScheduleInput) => ({ 
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
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreatePromotionScheduleInput) => ({ 
                  ...prev, 
                  notes: e.target.value || null
                }))
              }
              placeholder="Add any additional notes about this promotion..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || formData.employee_id === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Scheduling...' : '📅 Schedule Promotion'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}