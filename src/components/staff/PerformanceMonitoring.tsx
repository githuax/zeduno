import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Star, TrendingUp, Target, Plus, BarChart3, Award, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { Employee, PerformanceReview } from '@/types/staff.types';
import { toast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface PerformanceMonitoringProps {
  employees: Employee[];
  onRefresh: () => void;
}

export function PerformanceMonitoring({ employees, onRefresh }: PerformanceMonitoringProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newReview, setNewReview] = useState({
    employeeId: '',
    reviewPeriod: {
      start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    },
    overall_rating: 3,
    categories: [
      { name: 'Quality of Work', rating: 3, comments: '' },
      { name: 'Punctuality', rating: 3, comments: '' },
      { name: 'Teamwork', rating: 3, comments: '' },
      { name: 'Customer Service', rating: 3, comments: '' },
      { name: 'Initiative', rating: 3, comments: '' },
    ],
    goals: [
      { description: '', completed: false, dueDate: '' },
    ],
    strengths: [''],
    areasForImprovement: [''],
    comments: '',
    nextReviewDate: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
  });

  const activeEmployees = employees.filter(emp => emp.status === 'active');

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-800';
    if (rating >= 2.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleCreateReview = async () => {
    if (!newReview.employeeId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/performance-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...newReview,
          strengths: newReview.strengths.filter(s => s.trim()),
          areasForImprovement: newReview.areasForImprovement.filter(a => a.trim()),
          goals: newReview.goals.filter(g => g.description.trim()),
        }),
      });

      if (response.ok) {
        const employee = employees.find(e => e._id === newReview.employeeId);
        toast({
          title: 'Performance Review Created',
          description: `Review completed for ${employee?.firstName} ${employee?.lastName}`,
        });
        setIsCreateReviewOpen(false);
        resetNewReview();
        loadReviews();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to create review',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/performance-reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const resetNewReview = () => {
    setNewReview({
      employeeId: '',
      reviewPeriod: {
        start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
        end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      },
      overall_rating: 3,
      categories: [
        { name: 'Quality of Work', rating: 3, comments: '' },
        { name: 'Punctuality', rating: 3, comments: '' },
        { name: 'Teamwork', rating: 3, comments: '' },
        { name: 'Customer Service', rating: 3, comments: '' },
        { name: 'Initiative', rating: 3, comments: '' },
      ],
      goals: [
        { description: '', completed: false, dueDate: '' },
      ],
      strengths: [''],
      areasForImprovement: [''],
      comments: '',
      nextReviewDate: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
    });
  };

  const addGoal = () => {
    setNewReview(prev => ({
      ...prev,
      goals: [...prev.goals, { description: '', completed: false, dueDate: '' }],
    }));
  };

  const updateGoal = (index: number, field: keyof typeof newReview.goals[0], value: any) => {
    setNewReview(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => 
        i === index ? { ...goal, [field]: value } : goal
      ),
    }));
  };

  const removeGoal = (index: number) => {
    setNewReview(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const updateCategory = (index: number, field: 'rating' | 'comments', value: number | string) => {
    setNewReview(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      ),
    }));
  };

  const updateStringArray = (field: 'strengths' | 'areasForImprovement', index: number, value: string) => {
    setNewReview(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addStringItem = (field: 'strengths' | 'areasForImprovement') => {
    setNewReview(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeStringItem = (field: 'strengths' | 'areasForImprovement', index: number) => {
    setNewReview(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const filteredReviews = selectedEmployee === 'all' 
    ? reviews 
    : reviews.filter(review => review.employeeId === selectedEmployee);

  const performanceStats = {
    totalReviews: reviews.length,
    avgRating: reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length 
      : 0,
    completedGoals: reviews.reduce((sum, review) => 
      sum + review.goals.filter(g => g.completed).length, 0
    ),
    totalGoals: reviews.reduce((sum, review) => sum + review.goals.length, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Track employee performance and conduct reviews
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedEmployee}
            onValueChange={setSelectedEmployee}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {activeEmployees.map((employee) => (
                <SelectItem key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateReviewOpen} onOpenChange={setIsCreateReviewOpen}>
            <DialogTrigger asChild>
              <Button className="bg-restaurant-primary hover:bg-restaurant-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Performance Review</DialogTitle>
                <DialogDescription>
                  Conduct a comprehensive performance evaluation
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="ratings">Ratings</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Employee</Label>
                      <Select
                        value={newReview.employeeId}
                        onValueChange={(value) => setNewReview(prev => ({ ...prev, employeeId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeEmployees.map((employee) => (
                            <SelectItem key={employee._id} value={employee._id}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={employee.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(employee.firstName, employee.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{employee.firstName} {employee.lastName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Overall Rating</Label>
                      <Select
                        value={newReview.overall_rating.toString()}
                        onValueChange={(value) => setNewReview(prev => ({ ...prev, overall_rating: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 - Exceptional</SelectItem>
                          <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                          <SelectItem value="3">3 - Meets Expectations</SelectItem>
                          <SelectItem value="2">2 - Below Expectations</SelectItem>
                          <SelectItem value="1">1 - Needs Improvement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Review Period Start</Label>
                      <Input
                        type="date"
                        value={newReview.reviewPeriod.start}
                        onChange={(e) => setNewReview(prev => ({ 
                          ...prev, 
                          reviewPeriod: { ...prev.reviewPeriod, start: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Review Period End</Label>
                      <Input
                        type="date"
                        value={newReview.reviewPeriod.end}
                        onChange={(e) => setNewReview(prev => ({ 
                          ...prev, 
                          reviewPeriod: { ...prev.reviewPeriod, end: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Next Review Date</Label>
                    <Input
                      type="date"
                      value={newReview.nextReviewDate}
                      onChange={(e) => setNewReview(prev => ({ ...prev, nextReviewDate: e.target.value }))}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ratings" className="space-y-4">
                  <div className="space-y-4">
                    {newReview.categories.map((category, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label>Rating</Label>
                            <Select
                              value={category.rating.toString()}
                              onValueChange={(value) => updateCategory(index, 'rating', parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 - Exceptional</SelectItem>
                                <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                                <SelectItem value="3">3 - Meets Expectations</SelectItem>
                                <SelectItem value="2">2 - Below Expectations</SelectItem>
                                <SelectItem value="1">1 - Needs Improvement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Comments</Label>
                            <Textarea
                              placeholder={`Comments about ${category.name.toLowerCase()}...`}
                              value={category.comments}
                              onChange={(e) => updateCategory(index, 'comments', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="goals" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Goals & Objectives</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addGoal}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {newReview.goals.map((goal, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 space-y-3">
                          <div>
                            <Label>Goal Description</Label>
                            <Textarea
                              placeholder="Describe the goal or objective..."
                              value={goal.description}
                              onChange={(e) => updateGoal(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Due Date</Label>
                              <Input
                                type="date"
                                value={goal.dueDate}
                                onChange={(e) => updateGoal(index, 'dueDate', e.target.value)}
                              />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                              <input
                                type="checkbox"
                                checked={goal.completed}
                                onChange={(e) => updateGoal(index, 'completed', e.target.checked)}
                              />
                              <Label>Completed</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGoal(index)}
                                className="ml-auto text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {newReview.strengths.map((strength, index) => (
                          <div key={index} className="flex space-x-2">
                            <Input
                              placeholder="Enter a strength..."
                              value={strength}
                              onChange={(e) => updateStringArray('strengths', index, e.target.value)}
                            />
                            {newReview.strengths.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeStringItem('strengths', index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addStringItem('strengths')}
                        >
                          Add Strength
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {newReview.areasForImprovement.map((area, index) => (
                          <div key={index} className="flex space-x-2">
                            <Input
                              placeholder="Enter area for improvement..."
                              value={area}
                              onChange={(e) => updateStringArray('areasForImprovement', index, e.target.value)}
                            />
                            {newReview.areasForImprovement.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeStringItem('areasForImprovement', index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addStringItem('areasForImprovement')}
                        >
                          Add Area
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Label>Overall Comments</Label>
                    <Textarea
                      placeholder="General comments about the employee's performance..."
                      value={newReview.comments}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comments: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateReviewOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateReview}
                  disabled={!newReview.employeeId || isLoading}
                  className="bg-restaurant-primary hover:bg-restaurant-primary/90"
                >
                  {isLoading ? 'Creating...' : 'Create Review'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.totalReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRatingColor(performanceStats.avgRating)}`}>
              {performanceStats.avgRating.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Goals Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {performanceStats.completedGoals}
            </div>
            <p className="text-xs text-muted-foreground">
              of {performanceStats.totalGoals} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Goal Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {performanceStats.totalGoals > 0 
                ? ((performanceStats.completedGoals / performanceStats.totalGoals) * 100).toFixed(1)
                : 0
              }%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList>
          <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No performance reviews found</p>
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateReviewOpen(true)}
                >
                  Create First Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const employee = employees.find(e => e._id === review.employeeId);
                if (!employee) return null;

                return (
                  <Card key={review._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback className="bg-restaurant-primary/10 text-restaurant-primary">
                              {getInitials(employee.firstName, employee.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {employee.firstName} {employee.lastName}
                            </CardTitle>
                            <CardDescription>
                              {employee.position} • {employee.role}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="secondary"
                            className={`mb-2 ${getRatingBadgeColor(review.overall_rating)}`}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {review.overall_rating}/5
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.reviewDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Category Ratings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {review.categories.map((category, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                              <span className="text-sm font-medium">{category.name}</span>
                              <div className="flex items-center space-x-1">
                                <Star className={`h-3 w-3 ${getRatingColor(category.rating)}`} />
                                <span className="text-sm">{category.rating}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {review.goals.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Goals Progress</h4>
                          <div className="space-y-2">
                            {review.goals.slice(0, 3).map((goal, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle2 
                                  className={`h-4 w-4 ${goal.completed ? 'text-green-600' : 'text-gray-400'}`} 
                                />
                                <span className="text-sm truncate flex-1">{goal.description}</span>
                                {goal.dueDate && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(goal.dueDate), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            ))}
                            {review.goals.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                +{review.goals.length - 3} more goals
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {review.comments && (
                        <div>
                          <h4 className="font-medium mb-2">Comments</h4>
                          <p className="text-sm text-muted-foreground">{review.comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Analytics</CardTitle>
              <CardDescription>
                Comprehensive performance insights and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Advanced analytics and reporting features coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}