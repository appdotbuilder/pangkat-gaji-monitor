import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Building, Calendar, History, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
// Proper relative path calculation: from components/ up to client/, then up to root, then down to server/
import type { Employee, PromotionHistory, SalaryAdjustment } from '../../../server/src/schema';

interface EmployeeListProps {
  employees: Employee[];
  onRefresh: () => void;
}

interface EmployeeDetailsDialogProps {
  employee: Employee;
}

function EmployeeDetailsDialog({ employee }: EmployeeDetailsDialogProps) {
  const [promotionHistory, setPromotionHistory] = useState<PromotionHistory[]>([]);
  const [salaryAdjustments, setSalaryAdjustments] = useState<SalaryAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEmployeeDetails = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const [promotions, adjustments] = await Promise.all([
        trpc.getPromotionHistoryByEmployee.query({ employee_id: employee.id }),
        trpc.getSalaryAdjustmentsByEmployee.query({ employee_id: employee.id })
      ]);
      setPromotionHistory(promotions);
      setSalaryAdjustments(adjustments);
    } catch (error) {
      console.error('Failed to load employee details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={loadEmployeeDetails}>
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">👤 {employee.name}</DialogTitle>
          <DialogDescription>Employee ID: {employee.employee_id}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Employee Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span>{employee.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{employee.position}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Hired: {employee.hire_date.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="promotions">
            <TabsList>
              <TabsTrigger value="promotions">Promotion History</TabsTrigger>
              <TabsTrigger value="salary">Salary Adjustments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="promotions" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading promotion history...</div>
              ) : promotionHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No promotion history found
                </div>
              ) : (
                <div className="space-y-4">
                  {promotionHistory.map((promotion: PromotionHistory) => (
                    <Card key={promotion.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {promotion.previous_position || 'New Hire'} → {promotion.new_position}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Promotion Date: {promotion.promotion_date.toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Effective Date: {promotion.effective_date.toLocaleDateString()}
                            </p>
                            {promotion.notes && (
                              <p className="text-sm text-gray-700 mt-2 italic">{promotion.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-green-600 font-semibold">
                              <DollarSign className="h-4 w-4" />
                              {promotion.previous_salary && (
                                <span className="line-through text-gray-400 mr-2">
                                  ${promotion.previous_salary.toLocaleString()}
                                </span>
                              )}
                              <span>${promotion.new_salary.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="salary" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading salary history...</div>
              ) : salaryAdjustments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No salary adjustments found
                </div>
              ) : (
                <div className="space-y-4">
                  {salaryAdjustments.map((adjustment: SalaryAdjustment) => (
                    <Card key={adjustment.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg capitalize">
                              {adjustment.adjustment_type.replace('_', ' ')} Adjustment
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Effective Date: {adjustment.effective_date.toLocaleDateString()}
                            </p>
                            {adjustment.adjustment_percentage && (
                              <p className="text-sm text-gray-600">
                                Increase: {adjustment.adjustment_percentage}%
                              </p>
                            )}
                            {adjustment.notes && (
                              <p className="text-sm text-gray-700 mt-2 italic">{adjustment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center text-gray-500">
                                <DollarSign className="h-4 w-4" />
                                <span>${adjustment.previous_salary.toLocaleString()}</span>
                              </div>
                              <span>→</span>
                              <div className="flex items-center text-green-600 font-semibold">
                                <DollarSign className="h-4 w-4" />
                                <span>${adjustment.new_salary.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-sm text-green-600 mt-1">
                              +${(adjustment.new_salary - adjustment.previous_salary).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeList({ employees, onRefresh }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Get unique departments for filter
  const departments = Array.from(new Set(employees.map((emp: Employee) => emp.department))).sort();

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((employee: Employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === '' || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="🔍 Search employees..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={departmentFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((dept: string) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Employee Cards */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {employees.length === 0 ? (
            <div>
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No employees found</p>
              <p className="text-sm">Add your first employee to get started!</p>
            </div>
          ) : (
            <div>
              <p className="text-lg">No employees match your search</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEmployees.map((employee: Employee) => (
            <Card key={employee.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{employee.name}</h3>
                        <p className="text-sm text-gray-600">ID: {employee.employee_id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{employee.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{employee.department}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Hired: {employee.hire_date.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {employee.position}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <EmployeeDetailsDialog employee={employee} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}