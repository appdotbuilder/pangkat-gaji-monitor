import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
// Proper relative path calculation: from components/ up to client/, then up to root, then down to server/
import type { CreateEmployeeInput, Employee } from '../../../server/src/schema';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (employee: Employee) => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onEmployeeAdded }: AddEmployeeDialogProps) {
  const [formData, setFormData] = useState<CreateEmployeeInput>({
    name: '',
    employee_id: '',
    email: '',
    department: '',
    position: '',
    hire_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newEmployee = await trpc.createEmployee.mutate(formData);
      onEmployeeAdded(newEmployee);
      
      // Reset form
      setFormData({
        name: '',
        employee_id: '',
        email: '',
        department: '',
        position: '',
        hire_date: new Date()
      });
    } catch (error) {
      console.error('Failed to create employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">👤 Add New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to the system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEmployeeInput) => ({ ...prev, name: e.target.value }))
              }
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="employee_id">Employee ID *</Label>
            <Input
              id="employee_id"
              value={formData.employee_id}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEmployeeInput) => ({ ...prev, employee_id: e.target.value }))
              }
              placeholder="EMP001"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEmployeeInput) => ({ ...prev, email: e.target.value }))
              }
              placeholder="john.doe@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEmployeeInput) => ({ ...prev, department: e.target.value }))
                }
                placeholder="Engineering"
                required
              />
            </div>

            <div>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEmployeeInput) => ({ ...prev, position: e.target.value }))
                }
                placeholder="Software Engineer"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hire_date">Hire Date *</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date.toISOString().split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEmployeeInput) => ({ 
                  ...prev, 
                  hire_date: new Date(e.target.value)
                }))
              }
              required
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
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Adding...' : '➕ Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}