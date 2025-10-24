import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Toggle } from "../../components/ui/toggle";
import { BarChart3, Calendar, TrendingUp, CheckCircle, Target, BarChart, LineChart, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useFilters } from "../../hooks/useFilters";
import { toast } from "../../components/ui/sonner";

const monthlyData = [
  { month: "Jan", tv: 10000, digital: 8000, radio: 3000, print: 2000, crm: 2000, promo: 2500 },
  { month: "Feb", tv: 10000, digital: 8000, radio: 3000, print: 2000, crm: 2000, promo: 3000 },
  { month: "Mar", tv: 12000, digital: 9000, radio: 4000, print: 2000, crm: 2000, promo: 3500 },
  { month: "Apr", tv: 15000, digital: 12000, radio: 4000, print: 2000, crm: 2000, promo: 4000 },
  { month: "May", tv: 12000, digital: 10000, radio: 3000, print: 1500, crm: 2000, promo: 3000 },
  { month: "Jun", tv: 10000, digital: 8000, radio: 3000, print: 1500, crm: 2000, promo: 2500 },
];

const levers = [
  { name: "TV", refBudget: 120000, newBudget: 120000, roi: 4.2 },
  { name: "Digital", refBudget: 80000, newBudget: 80000, roi: 5.1 },
  { name: "Radio", refBudget: 50000, newBudget: 50000, roi: 3.4 },
  { name: "Print", refBudget: 30000, newBudget: 30000, roi: 2.8 },
  { name: "CRM", refBudget: 20000, newBudget: 20000, roi: 6.2 },
  { name: "Promo", refBudget: 35000, newBudget: 35000, roi: 3.9 },
  { name: "Cinema", refBudget: 15000, newBudget: 15000, roi: 2.5 },
];

type SimulationStep = 1 | 2 | 3 | 4;

const CreateSimulation: React.FC<{ onClose: () => void, onComplete: (scenario: any) => void }> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<SimulationStep>(1);
  const [selectedKpi, setSelectedKpi] = useState<string>("volume");
  const [totalBudget, setTotalBudget] = useState<string>("350000");
  const [scenarioName, setScenarioName] = useState<string>("New Simulation");
  const [timeframeFrom, setTimeframeFrom] = useState<string>("Jan 2024");
  const [timeframeTo, setTimeframeTo] = useState<string>("Aug 2024");
  const [granularity, setGranularity] = useState<string>("month");
  const [viewMode, setViewMode] = useState<string>("table");
  const [freezeBudgets, setFreezeBudgets] = useState<boolean>(false);
  const [overallConstraints, setOverallConstraints] = useState<boolean>(false);
  const [costPerMetric, setCostPerMetric] = useState<boolean>(false);
  const [selectedLevers, setSelectedLevers] = useState<string[]>(levers.map(l => l.name));
  const [leverBudgets, setLeverBudgets] = useState(levers);
  
  const filters = useFilters();

  const calculateExpectedRoi = (leverName: string, newBudget: number) => {
    const lever = levers.find(l => l.name === leverName);
    if (!lever) return 0;
    
    const baseRoi = lever.roi;
    const refBudget = lever.refBudget;
    
    // Calculate budget ratio (how much the new budget differs from the reference)
    const budgetRatio = refBudget > 0 ? newBudget / refBudget : 1;
    
    let adjustedRoi = baseRoi;
    
    // More significant impact on ROI with budget changes
    // Law of diminishing returns for higher investments
    if (budgetRatio > 1.5) {
      // Significant budget increase: Strong diminishing returns
      adjustedRoi = baseRoi * (0.75 + (0.25 / budgetRatio));
    } else if (budgetRatio > 1.2) {
      // Moderate budget increase: Moderate diminishing returns
      adjustedRoi = baseRoi * (0.85 + (0.15 / budgetRatio));
    } else if (budgetRatio > 1) {
      // Small budget increase: Minor diminishing returns
      adjustedRoi = baseRoi * (0.95 + (0.05 / budgetRatio));
    } else if (budgetRatio > 0.8) {
      // Small budget decrease: Slight ROI improvement
      adjustedRoi = baseRoi * (1 + (1 - budgetRatio) * 0.1);
    } else if (budgetRatio > 0.5) {
      // Moderate budget decrease: Better ROI improvement
      adjustedRoi = baseRoi * (1 + (1 - budgetRatio) * 0.2);
    } else {
      // Significant budget decrease: Best ROI improvement but much lower total contribution
      adjustedRoi = baseRoi * (1 + (1 - budgetRatio) * 0.3);
    }
    
    return adjustedRoi;
  };

  const updateLeverBudget = (leverName: string, newValue: number) => {
    setLeverBudgets(prev => 
      prev.map(lever => {
        if (lever.name === leverName) {
          const originalLever = levers.find(l => l.name === leverName);
          if (!originalLever) return lever;
          
          const updatedRoi = calculateExpectedRoi(leverName, newValue);
          
          return { 
            ...lever, 
            newBudget: newValue,
            roi: updatedRoi
          };
        }
        return lever;
      })
    );
  };
  
  const calculateTotalNewBudget = () => {
    return leverBudgets.reduce((sum, lever) => sum + lever.newBudget, 0);
  };
  
  const calculateTotalRefBudget = () => {
    return leverBudgets.reduce((sum, lever) => sum + lever.refBudget, 0);
  };
  
  const calculateVariation = () => {
    const totalNew = calculateTotalNewBudget();
    const totalRef = calculateTotalRefBudget();
    return ((totalNew - totalRef) / totalRef) * 100;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => (prev + 1) as SimulationStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as SimulationStep);
    }
  };

  const handleSubmit = () => {
    const newScenario = {
      id: Date.now(),
      name: scenarioName,
      status: "completed",
      roi: (leverBudgets.reduce((acc, lever) => acc + lever.roi * lever.newBudget, 0) / 
        leverBudgets.reduce((acc, lever) => acc + lever.newBudget, 0)).toFixed(1),
      contribution: Math.round(leverBudgets.reduce((acc, lever) => acc + lever.roi * lever.newBudget, 0)),
      date: new Date().toISOString().split('T')[0],
      type: "simulation",
      kpi: selectedKpi,
      totalBudget: parseFloat(totalBudget),
      levers: leverBudgets,
      timeframe: `${timeframeFrom} - ${timeframeTo}`
    };
    
    toast.success("Simulation created successfully", {
      description: `${scenarioName} has been added to your scenarios list.`,
    });
    
    onComplete(newScenario);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Select KPI to Simulate</h2>
            <p className="text-muted-foreground">Choose the primary KPI you want to optimize in this simulation</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className={`cursor-pointer hover:shadow-md transition-shadow ${selectedKpi === 'volume' ? 'border-primary border-2' : ''}`} onClick={() => setSelectedKpi('volume')}>
                <CardHeader className="text-center pb-2">
                  <BarChart3 className="mx-auto h-12 w-12 text-primary" />
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <h3 className="text-lg font-medium">Volume</h3>
                  <p className="text-sm text-muted-foreground">Optimize for sales quantity</p>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer hover:shadow-md transition-shadow ${selectedKpi === 'turnover' ? 'border-primary border-2' : ''}`} onClick={() => setSelectedKpi('turnover')}>
                <CardHeader className="text-center pb-2">
                  <TrendingUp className="mx-auto h-12 w-12 text-primary" />
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <h3 className="text-lg font-medium">Turnover</h3>
                  <p className="text-sm text-muted-foreground">Optimize for total revenue</p>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer hover:shadow-md transition-shadow ${selectedKpi === 'profit' ? 'border-primary border-2' : ''}`} onClick={() => setSelectedKpi('profit')}>
                <CardHeader className="text-center pb-2">
                  <Target className="mx-auto h-12 w-12 text-primary" />
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <h3 className="text-lg font-medium">Profit</h3>
                  <p className="text-sm text-muted-foreground">Optimize for net margin</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Configure Scenario Parameters</h2>
            <p className="text-muted-foreground">Set up your simulation parameters and constraints</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input 
                    id="name" 
                    value={scenarioName} 
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Enter scenario name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">€</span>
                    <Input 
                      id="budget" 
                      value={totalBudget} 
                      onChange={(e) => setTotalBudget(e.target.value)}
                      type="number" 
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <Select value={timeframeFrom} onValueChange={setTimeframeFrom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jan 2024">Jan 2024</SelectItem>
                        <SelectItem value="Feb 2024">Feb 2024</SelectItem>
                        <SelectItem value="Mar 2024">Mar 2024</SelectItem>
                        <SelectItem value="Apr 2024">Apr 2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Select value={timeframeTo} onValueChange={setTimeframeTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jun 2024">Jun 2024</SelectItem>
                        <SelectItem value="Jul 2024">Jul 2024</SelectItem>
                        <SelectItem value="Aug 2024">Aug 2024</SelectItem>
                        <SelectItem value="Sep 2024">Sep 2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="granularity">Granularity</Label>
                  <Select value={granularity} onValueChange={setGranularity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select granularity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Select Levers to Simulate</h3>
                <div className="h-56 border rounded-md p-2 overflow-y-auto">
                  {levers.map(lever => (
                    <div key={lever.name} className="flex items-center space-x-2 py-2">
                      <input 
                        type="checkbox" 
                        id={lever.name} 
                        checked={selectedLevers.includes(lever.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLevers(prev => [...prev, lever.name]);
                          } else {
                            setSelectedLevers(prev => prev.filter(l => l !== lever.name));
                          }
                        }}
                        className="h-4 w-4 border-gray-300 rounded" 
                      />
                      <Label htmlFor={lever.name}>{lever.name}</Label>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col space-y-4 mt-4">
                  <Toggle pressed={freezeBudgets} onPressedChange={setFreezeBudgets}>
                    Freeze budgets
                  </Toggle>
                  <Toggle pressed={overallConstraints} onPressedChange={setOverallConstraints}>
                    Apply overall constraints
                  </Toggle>
                  <Toggle pressed={costPerMetric} onPressedChange={setCostPerMetric}>
                    Show cost per metric
                  </Toggle>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Visualize and Adjust Investments</h2>
            <p className="text-muted-foreground">Fine-tune your investments by channel and period</p>
            
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
              <TabsList>
                <TabsTrigger value="table">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                  </svg>
                  Table
                </TabsTrigger>
                <TabsTrigger value="planner">
                  <Calendar className="mr-2 h-4 w-4" />
                  Planner
                </TabsTrigger>
                <TabsTrigger value="graph">
                  <LineChart className="mr-2 h-4 w-4" />
                  Graph
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead className="text-right">Reference Budget (€)</TableHead>
                        <TableHead className="text-right">New Budget (€)</TableHead>
                        <TableHead className="text-right">Variation (%)</TableHead>
                        <TableHead className="text-right">Expected ROI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leverBudgets.filter(lever => selectedLevers.includes(lever.name)).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{row.refBudget.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Input 
                              type="number"
                              value={row.newBudget}
                              onChange={(e) => updateLeverBudget(row.name, parseInt(e.target.value) || 0)}
                              className="w-28 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell 
                            className={`text-right ${
                              row.refBudget !== row.newBudget 
                                ? row.newBudget > row.refBudget
                                  ? 'text-green-600' 
                                  : 'text-red-600' 
                                : ''
                            }`}
                          >
                            {row.refBudget === 0 ? 'N/A' : (((row.newBudget - row.refBudget) / row.refBudget) * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {row.roi.toFixed(1)}x
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{calculateTotalRefBudget().toLocaleString()}</TableCell>
                        <TableCell className="text-right">{calculateTotalNewBudget().toLocaleString()}</TableCell>
                        <TableCell 
                          className={`text-right ${
                            calculateVariation() > 0 
                              ? 'text-green-600' 
                              : calculateVariation() < 0 
                                ? 'text-red-600' 
                                : ''
                          }`}
                        >
                          {calculateVariation().toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {(leverBudgets.filter(lever => selectedLevers.includes(lever.name))
                            .reduce((acc, lever) => acc + (lever.roi * lever.newBudget), 0) / 
                            leverBudgets.filter(lever => selectedLevers.includes(lever.name))
                            .reduce((acc, lever) => acc + lever.newBudget, 0)).toFixed(1)}x
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="planner" className="mt-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => `€${value/1000}K`}
                      />
                      <Tooltip 
                        formatter={(value) => [`€${Number(value).toLocaleString()}`, ""]}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      {selectedLevers.includes("TV") && <Bar dataKey="tv" name="TV" stackId="a" fill="#8884d8" />}
                      {selectedLevers.includes("Digital") && <Bar dataKey="digital" name="Digital" stackId="a" fill="#55B78D" />}
                      {selectedLevers.includes("Radio") && <Bar dataKey="radio" name="Radio" stackId="a" fill="#82ca9d" />}
                      {selectedLevers.includes("Print") && <Bar dataKey="print" name="Print" stackId="a" fill="#ffc658" />}
                      {selectedLevers.includes("CRM") && <Bar dataKey="crm" name="CRM" stackId="a" fill="#ff8042" />}
                      {selectedLevers.includes("Promo") && <Bar dataKey="promo" name="Promo" stackId="a" fill="#0088fe" />}
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="graph" className="mt-6">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={leverBudgets.filter(lever => selectedLevers.includes(lever.name))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis 
                        yAxisId="left"
                        orientation="left"
                        tickFormatter={(value) => `€${value/1000}K`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 'dataMax']}
                        tickFormatter={(value) => `${value}x`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="newBudget" name="Budget" fill="#55B78D" />
                      <Bar yAxisId="right" dataKey="roi" name="Expected ROI" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Expected Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Investment:</p>
                  <p className="text-xl font-bold">€{calculateTotalNewBudget().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Contribution:</p>
                  <p className="text-xl font-bold">
                    €{Math.round(leverBudgets.reduce((acc, lever) => acc + (lever.roi * lever.newBudget), 0)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average ROI:</p>
                  <p className="text-xl font-bold">
                    {(leverBudgets.reduce((acc, lever) => acc + (lever.roi * lever.newBudget), 0) / calculateTotalNewBudget()).toFixed(1)}x
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Save and Run Simulation</h2>
            <p className="text-muted-foreground">Review your simulation parameters before running</p>
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Scenario Name</dt>
                    <dd className="text-lg font-medium">{scenarioName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Target KPI</dt>
                    <dd className="text-lg font-medium capitalize">{selectedKpi}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Total Budget</dt>
                    <dd className="text-lg font-medium">€{parseInt(totalBudget).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Timeframe</dt>
                    <dd className="text-lg font-medium">{timeframeFrom} to {timeframeTo}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Expected Average ROI</dt>
                    <dd className="text-lg font-medium">
                      {(leverBudgets.reduce((acc, lever) => acc + lever.roi * lever.newBudget, 0) / calculateTotalNewBudget()).toFixed(1)}x
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Selected Channels</dt>
                    <dd className="text-lg font-medium">{selectedLevers.join(", ")}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <CheckCircle className="inline-block mr-2 h-5 w-5 text-green-600" />
                Simulation Ready
              </h3>
              <p>Your simulation is configured and ready to run. Click Simulate to see the results.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create Simulation</h1>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
      
      <div className="mb-8">
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
            <div 
              className="bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step} 
                className={`flex flex-col items-center ${
                  step <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                  step <= currentStep ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                }`}>
                  {step}
                </div>
                <span className="text-xs mt-1">{
                  step === 1 ? "Select KPI" :
                  step === 2 ? "Configure Parameters" :
                  step === 3 ? "Adjust Investments" :
                  "Review & Run"
                }</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {renderStepContent()}
      
      <div className="mt-8 flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => {
              toast.info("Draft saved", {
                description: `${scenarioName} has been saved as a draft.`,
              });
              onClose();
            }}>
              Save Draft
            </Button>
            <Button onClick={handleSubmit}>
              Simulate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSimulation;
