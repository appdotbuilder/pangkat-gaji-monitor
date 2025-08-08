import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
// Proper relative path calculation: from components/ up to client/, then up to root, then down to server/
import type { PromotionSchedule, Employee } from '../../../server/src/schema';

interface UpcomingPromotionsProps {
  promotions: PromotionSchedule[];
  employees: Employee[];
  onRefresh: () => void;
}

export function UpcomingPromotions({ promotions, employees, onRefresh }: UpcomingPromotionsProps) {
  // Create a map for quick employee lookup
  const employeeMap = new Map(employees.map((emp: Employee) => [emp.id, emp]));

  // Sort promotions by scheduled date
  const sortedPromotions = [...promotions].sort((a: PromotionSchedule, b: PromotionSchedule) => 
    a.scheduled_date.getTime() - b.scheduled_date.getTime()
  );

  const handleApprove = async (promotionId: number) => {
    try {
      await trpc.updatePromotionSchedule.mutate({
        id: promotionId,
        status: 'approved'
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to approve promotion:', error);
    }
  };

  const handleComplete = async (promotionId: number) => {
    try {
      await trpc.updatePromotionSchedule.mutate({
        id: promotionId,
        status: 'completed'
      });
      onRefresh();
    } catch (error) {
      console.error('Failed to complete promotion:', error);
    }
  };

  // Calculate days until promotion
  const getDaysUntil = (date: Date): number => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get urgency badge
  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge className="bg-orange-500">This Week</Badge>;
    } else if (daysUntil <= 14) {
      return <Badge className="bg-yellow-500">Next 2 Weeks</Badge>;
    } else {
      return <Badge variant="outline">This Month</Badge>;
    }
  };

  if (sortedPromotions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">No upcoming promotions</p>
        <p className="text-sm">All promotion schedules are up to date!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedPromotions.map((promotion: PromotionSchedule) => {
        const employee = employeeMap.get(promotion.employee_id);
        const daysUntil = getDaysUntil(promotion.scheduled_date);
        const salaryIncrease = promotion.target_salary - promotion.current_salary;
        const increasePercentage = ((salaryIncrease / promotion.current_salary) * 100).toFixed(1);

        return (
          <Card key={promotion.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {employee?.name || 'Unknown Employee'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {promotion.current_position} → {promotion.target_position}
                      </p>
                    </div>
                    {getUrgencyBadge(daysUntil)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium">Scheduled Date</span>
                        <p className="text-sm text-gray-600">
                          {promotion.scheduled_date.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {daysUntil < 0 
                            ? `${Math.abs(daysUntil)} days overdue`
                            : daysUntil === 0 
                            ? 'Today!'
                            : `in ${daysUntil} days`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <span className="text-sm font-medium">Salary Change</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            ${promotion.current_salary.toLocaleString()}
                          </span>
                          <span>→</span>
                          <span className="text-sm font-semibold text-green-600">
                            ${promotion.target_salary.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-green-600">
                          +${salaryIncrease.toLocaleString()} ({increasePercentage}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium">Status</span>
                        <div className="mt-1">
                          <Badge 
                            variant={promotion.status === 'pending' ? 'secondary' : 
                                   promotion.status === 'approved' ? 'default' : 'outline'}
                            className={promotion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      promotion.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {promotion.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">{promotion.notes}</p>
                    </div>
                  )}

                  {employee && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Department: {employee.department}</p>
                      <p>Employee ID: {employee.employee_id}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {daysUntil < 0 && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Overdue
                    </div>
                  )}
                  
                  {promotion.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(promotion.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                  )}
                  
                  {promotion.status === 'approved' && daysUntil <= 0 && (
                    <Button 
                      size="sm" 
                      onClick={() => handleComplete(promotion.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}