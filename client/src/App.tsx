import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, TrendingUp, Clock, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { EmployeeList } from '@/components/EmployeeList';
import { UpcomingPromotions } from '@/components/UpcomingPromotions';
import { PromotionSchedules } from '@/components/PromotionSchedules';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { AddPromotionScheduleDialog } from '@/components/AddPromotionScheduleDialog';
// Using type-only imports for better TypeScript compliance
import type { Employee, PromotionSchedule } from '../../server/src/schema';

function App() {
  // State management with proper typing
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [promotionSchedules, setPromotionSchedules] = useState<PromotionSchedule[]>([]);
  const [upcomingPromotions, setUpcomingPromotions] = useState<PromotionSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddPromotion, setShowAddPromotion] = useState(false);

  // Memoized data loading functions
  const loadEmployees = useCallback(async () => {
    try {
      const result = await trpc.getEmployees.query();
      setEmployees(result);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  const loadPromotionSchedules = useCallback(async () => {
    try {
      const result = await trpc.getAllPromotionSchedules.query();
      setPromotionSchedules(result);
    } catch (error) {
      console.error('Failed to load promotion schedules:', error);
    }
  }, []);

  const loadUpcomingPromotions = useCallback(async () => {
    try {
      const result = await trpc.getUpcomingPromotions.query({ days_ahead: 30 });
      setUpcomingPromotions(result);
    } catch (error) {
      console.error('Failed to load upcoming promotions:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadPromotionSchedules(),
        loadUpcomingPromotions()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadEmployees, loadPromotionSchedules, loadUpcomingPromotions]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handler for successful employee creation
  const handleEmployeeAdded = useCallback((newEmployee: Employee) => {
    setEmployees((prev: Employee[]) => [...prev, newEmployee]);
    setShowAddEmployee(false);
  }, []);

  // Handler for successful promotion schedule creation
  const handlePromotionScheduleAdded = useCallback((newSchedule: PromotionSchedule) => {
    setPromotionSchedules((prev: PromotionSchedule[]) => [...prev, newSchedule]);
    setShowAddPromotion(false);
    // Refresh upcoming promotions as well
    loadUpcomingPromotions();
  }, [loadUpcomingPromotions]);

  // Calculate stats
  const totalEmployees = employees.length;
  const pendingPromotions = promotionSchedules.filter(p => p.status === 'pending').length;
  const upcomingThisMonth = upcomingPromotions.length;
  const approvedPromotions = promotionSchedules.filter(p => p.status === 'approved').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📈 Employee Promotion Monitor
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor promotion schedules and salary adjustments for your team
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{totalEmployees}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Promotions</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{pendingPromotions}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming (30 days)</CardTitle>
              <CalendarDays className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{upcomingThisMonth}</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-800">{approvedPromotions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="bg-white shadow-md">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                🔔 Upcoming Promotions
              </TabsTrigger>
              <TabsTrigger value="schedules" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                📅 All Schedules
              </TabsTrigger>
              <TabsTrigger value="employees" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                👥 Employees
              </TabsTrigger>
            </TabsList>
            
            <div className="space-x-2">
              <Button 
                onClick={() => setShowAddEmployee(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
              <Button 
                onClick={() => setShowAddPromotion(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={employees.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Promotion
              </Button>
            </div>
          </div>

          <TabsContent value="upcoming" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">🔔 Upcoming Promotions (Next 30 Days)</CardTitle>
                <CardDescription>
                  Promotions that are scheduled to happen soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingPromotions 
                  promotions={upcomingPromotions} 
                  employees={employees}
                  onRefresh={loadUpcomingPromotions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">📅 All Promotion Schedules</CardTitle>
                <CardDescription>
                  Complete list of promotion schedules with status tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PromotionSchedules 
                  schedules={promotionSchedules} 
                  employees={employees}
                  onRefresh={loadPromotionSchedules}
                  onUpcomingRefresh={loadUpcomingPromotions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">👥 Employee Directory</CardTitle>
                <CardDescription>
                  Manage employees and view their promotion history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeList 
                  employees={employees} 
                  onRefresh={loadEmployees}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddEmployeeDialog 
          open={showAddEmployee}
          onOpenChange={setShowAddEmployee}
          onEmployeeAdded={handleEmployeeAdded}
        />

        <AddPromotionScheduleDialog 
          open={showAddPromotion}
          onOpenChange={setShowAddPromotion}
          employees={employees}
          onPromotionScheduleAdded={handlePromotionScheduleAdded}
        />
      </div>
    </div>
  );
}

export default App;