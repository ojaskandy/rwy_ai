import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'idle';
  message: string;
  responseTime?: number;
}

export default function Health() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const healthChecks = [
    { name: 'Server Status', endpoint: '/api/health', test: 'basic' },
    { name: 'Database Connection', endpoint: '/api/health/database', test: 'database' },
    { name: 'OpenAI API', endpoint: '/api/health/openai', test: 'openai' },
    { name: 'User Profile API', endpoint: '/api/health/user-profile', test: 'profile' },
    { name: 'Photo Upload', endpoint: '/api/health/photo-upload', test: 'upload' },
    { name: 'Ocean Chat AI', endpoint: '/api/health/ocean-chat', test: 'chat' },
    { name: 'Calendar API', endpoint: '/api/health/calendar', test: 'calendar' },
    { name: 'File System', endpoint: '/api/health/filesystem', test: 'filesystem' },
  ];

  const authenticate = () => {
    if (password === import.meta.env.VITE_CODE || password === '280806') {
      setIsAuthenticated(true);
      setAuthError('');
      initializeChecks();
    } else {
      setAuthError('Invalid access code');
    }
  };

  const initializeChecks = () => {
    setChecks(healthChecks.map(check => ({
      name: check.name,
      status: 'idle' as const,
      message: 'Ready to test'
    })));
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    
    // Initialize all checks as 'checking'
    setChecks(prev => prev.map(check => ({
      ...check,
      status: 'checking' as const,
      message: 'Testing...'
    })));

    // Run tests sequentially to avoid overwhelming the server
    for (let i = 0; i < healthChecks.length; i++) {
      await runSingleTest(healthChecks[i], i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsRunningTests(false);
  };

  const runSingleTest = async (check: any, index: number) => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(check.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: check.test })
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      setChecks(prev => prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              status: response.ok ? 'success' : 'error',
              message: data.message || (response.ok ? 'OK' : 'Failed'),
              responseTime
            }
          : item
      ));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setChecks(prev => prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              status: 'error',
              message: error instanceof Error ? error.message : 'Network error',
              responseTime
            }
          : item
      ));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Testing</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-4"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                System Health Monitor
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter access code to view system diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Access Code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                  className={`text-black placeholder:text-gray-500 bg-white ${authError ? 'border-red-300 focus:border-red-500' : ''}`}
                />
                {authError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-700 flex items-center gap-2 font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {authError}
                  </motion.p>
                )}
              </div>
              <Button 
                onClick={authenticate}
                className="w-full bg-black text-white hover:bg-gray-800 font-medium"
              >
                Access Health Monitor
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            System Health Monitor
          </h1>
          <p className="text-gray-700">Real-time diagnostics for all Runway AI services</p>
        </motion.div>

        {/* Controls */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  className="bg-black text-white hover:bg-gray-800 font-medium"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    'Run All Tests'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={initializeChecks}
                  disabled={isRunningTests}
                >
                  Reset
                </Button>
              </div>
              <div className="text-sm text-gray-700">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {checks.map((check, index) => (
              <motion.div
                key={check.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900">{check.name}</CardTitle>
                      {getStatusIcon(check.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(check.status)}
                      {check.responseTime && (
                        <span className="text-sm text-gray-500">
                          {check.responseTime}ms
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 min-h-[20px]">
                      {check.message}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        {checks.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">System Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {checks.filter(c => c.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Online</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-red-600">
                    {checks.filter(c => c.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {checks.filter(c => c.status === 'checking').length}
                  </div>
                  <div className="text-sm text-gray-600">Testing</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-600">
                    {checks.filter(c => c.responseTime).reduce((avg, c) => avg + (c.responseTime || 0), 0) / 
                     Math.max(checks.filter(c => c.responseTime).length, 1)}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}