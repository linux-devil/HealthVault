import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Calendar, TrendingUp, Target, Activity } from 'lucide-react';

const MacroChart = () => {
  const [dailyStats, setDailyStats] = useState([]);
  const [macroEntries, setMacroEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMacroData();
  }, []);

  const fetchMacroData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily stats
      const dailyResponse = await fetch('http://localhost:5000/api/daily-macro-stats?days=14');
      if (dailyResponse.ok) {
        const dailyData = await dailyResponse.json();
        setDailyStats(dailyData.reverse()); // Reverse to show chronologically
      }

      // Fetch macro entries
      const entriesResponse = await fetch('http://localhost:5000/api/macro-entries');
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        setMacroEntries(entriesData);
      }

    } catch (err) {
      setError('Failed to load macro data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate today's totals
  const todayStats = dailyStats.find(stat => stat.entry_date === new Date().toISOString().split('T')[0]);
  
  // Pie chart colors
  const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  // Prepare pie chart data
  const getPieChartData = (stats) => {
    if (!stats) return [];
    
    const totalMacros = stats.total_protein + stats.total_carbs + stats.total_fat;
    if (totalMacros === 0) return [];

    return [
      { 
        name: 'Protein', 
        value: stats.total_protein, 
        percentage: ((stats.total_protein / totalMacros) * 100).toFixed(1)
      },
      { 
        name: 'Carbs', 
        value: stats.total_carbs, 
        percentage: ((stats.total_carbs / totalMacros) * 100).toFixed(1)
      },
      { 
        name: 'Fat', 
        value: stats.total_fat, 
        percentage: ((stats.total_fat / totalMacros) * 100).toFixed(1)
      }
    ];
  };

  // Custom tooltip for pie chart
  const renderPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value}g ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading macro data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Today's Summary */}
      {todayStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Nutrition Summary
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(todayStats.total_calories)}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(todayStats.total_protein)}g
                </div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(todayStats.total_carbs)}g
                </div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(todayStats.total_fat)}g
                </div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {todayStats.meal_count}
                </div>
                <div className="text-sm text-gray-600">Meals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Today's Breakdown</TabsTrigger>
          <TabsTrigger value="calories">Calorie Tracking</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                14-Day Macro Trends
              </CardTitle>
              <CardDescription>
                Track your daily macro intake over the past two weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="entry_date" 
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value, name) => [`${Math.round(value)}g`, name]}
                  />
                  <Legend />
                  <Bar dataKey="total_protein" fill="#8884d8" name="Protein (g)" />
                  <Bar dataKey="total_carbs" fill="#82ca9d" name="Carbs (g)" />
                  <Bar dataKey="total_fat" fill="#ffc658" name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Today's Macro Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of today's protein, carbs, and fat intake
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayStats && getPieChartData(todayStats).length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData(todayStats)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData(todayStats).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={renderPieTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2">
                    {getPieChartData(todayStats).map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: PIE_COLORS[index] }}
                        />
                        <span className="text-sm">
                          {item.name}: {item.value}g ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No macro data for today yet.</p>
                  <p className="text-sm">Start logging your meals to see the breakdown!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calorie Tracking Tab */}
        <TabsContent value="calories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Calorie Intake</CardTitle>
              <CardDescription>
                Track your daily calorie consumption over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="entry_date" 
                    tickFormatter={formatDate}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [`${Math.round(value)} cal`, 'Calories']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_calories" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Daily Calories"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Entries */}
      {macroEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>
              Your latest food log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {macroEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.transcribed_text.length > 50 
                        ? entry.transcribed_text.substring(0, 50) + '...'
                        : entry.transcribed_text
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()} at {' '}
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(entry.total_calories)} cal
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(entry.total_protein)}g protein
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MacroChart;