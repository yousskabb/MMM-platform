import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Slider } from "../../components/ui/slider";
import { Switch } from "../../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ChevronLeft, ChevronRight, CheckCircle, Target, TrendingUp, BarChart3 } from "lucide-react";
import {
  Treemap,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { toast } from "../../components/ui/sonner";

const optimizationChannels = [
  { name: "TV", minPercent: 20, maxPercent: 40, frozen: false, currentBudget: 110000 },
  { name: "Digital", minPercent: 15, maxPercent: 35, frozen: false, currentBudget: 95000 },
  { name: "Radio", minPercent: 5, maxPercent: 15, frozen: false, currentBudget: 35000 },
  { name: "Print", minPercent: 0, maxPercent: 10, frozen: false, currentBudget: 15000 },
  { name: "CRM", minPercent: 5, maxPercent: 20, frozen: false, currentBudget: 45000 },
  { name: "Promo", minPercent: 10, maxPercent: 30, frozen: false, currentBudget: 50000 }
];

const COLORS = ["#8884d8", "#55B78D", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

type OptimizationStep = 1 | 2;

const CreateOptimization: React.FC<{ onClose: () => void, onComplete: (scenario: any) => void }> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OptimizationStep>(1);
  const [totalBudget, setTotalBudget] = useState<string>("350000");
  const [scenarioName, setScenarioName] = useState<string>("New Optimization");
  const [targetKpi, setTargetKpi] = useState<string>("roi");
  const [timeframeFrom, setTimeframeFrom] = useState<string>("Jan 2024");
  const [timeframeTo, setTimeframeTo] = useState<string>("Aug 2024");
  const [overrideConstraints, setOverrideConstraints] = useState<boolean>(false);
  const [channels, setChannels] = useState(optimizationChannels);
  
  const [optimizedResult, setOptimizedResult] = useState<any>(null);

  const handleChannelFrozenChange = (channelName: string, frozen: boolean) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.name === channelName ? { ...channel, frozen } : channel
      )
    );
  };

  const handleChannelMinChange = (channelName: string, value: number[]) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.name === channelName ? { ...channel, minPercent: value[0] } : channel
      )
    );
  };

  const handleChannelMaxChange = (channelName: string, value: number[]) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.name === channelName ? { ...channel, maxPercent: value[0] } : channel
      )
    );
  };

  const handleOptimize = () => {
    // In a real app, we'd call an API here to get the optimized results
    // For now, we'll simulate the optimization with mock data
    
    // Calculate budget based on min/max percentages and frozen state
    const totalBudgetNum = parseFloat(totalBudget);
    
    // Frozen channels keep their current budget
    let frozenBudget = 0;
    let frozenChannels = channels.filter(c => c.frozen);
    frozenChannels.forEach(channel => {
      frozenBudget += channel.currentBudget;
    });
    
    // Distribute remaining budget according to constraints
    const remainingBudget = totalBudgetNum - frozenBudget;
    const unfrozenChannels = channels.filter(c => !c.frozen);
    
    let optimizedChannels = [...channels].map(channel => {
      if (channel.frozen) {
        return {
          name: channel.name,
          size: channel.currentBudget,
          percentage: Math.round((channel.currentBudget / totalBudgetNum) * 100 * 10) / 10
        };
      } else {
        // Simulated optimization logic - in reality, this would be more complex
        // We're just using a formula that biases toward channels with higher max limits
        const randomFactor = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0
        const weight = channel.maxPercent / unfrozenChannels.reduce((sum, c) => sum + c.maxPercent, 0);
        const percentage = channel.minPercent + ((channel.maxPercent - channel.minPercent) * randomFactor);
        const allocatedBudget = remainingBudget * weight * randomFactor;
        
        return {
          name: channel.name,
          size: Math.round(allocatedBudget),
          percentage: Math.round((allocatedBudget / totalBudgetNum) * 100 * 10) / 10
        };
      }
    });
    
    // Normalize to ensure total is exactly 100%
    const totalAllocated = optimizedChannels.reduce((sum, channel) => sum + channel.size, 0);
    const adjustmentFactor = totalBudgetNum / totalAllocated;
    
    optimizedChannels = optimizedChannels.map(channel => ({
      ...channel,
      size: Math.round(channel.size * adjustmentFactor),
      percentage: Math.round((channel.size * adjustmentFactor / totalBudgetNum) * 100 * 10) / 10
    }));
    
    // Update totals again
    const finalTotal = optimizedChannels.reduce((sum, channel) => sum + channel.size, 0);
    const diff = totalBudgetNum - finalTotal;
    
    // Add any rounding difference to the largest channel to ensure exact match
    if (Math.abs(diff) > 0) {
      const largestChannel = [...optimizedChannels].sort((a, b) => b.size - a.size)[0];
      optimizedChannels = optimizedChannels.map(channel => {
        if (channel.name === largestChannel.name) {
          return {
            ...channel,
            size: channel.size + diff,
            percentage: Math.round(((channel.size + diff) / totalBudgetNum) * 100 * 10) / 10
          };
        }
        return channel;
      });
    }
    
    setOptimizedResult({
      channels: optimizedChannels,
      totalBudget: totalBudgetNum,
      roi: (Math.random() * 2 + 6).toFixed(1), // Random ROI between 6 and 8
      contribution: Math.round(totalBudgetNum * (Math.random() * 2 + 6)) // Random contribution based on ROI
    });
    
    setCurrentStep(2);
  };

  const handleSubmitOptimization = () => {
    // Create the optimization scenario
    const newScenario = {
      id: Date.now(),
      name: scenarioName,
      status: "completed",
      roi: optimizedResult.roi,
      contribution: optimizedResult.contribution,
      date: new Date().toISOString().split('T')[0],
      type: "optimization",
      kpi: targetKpi,
      totalBudget: parseFloat(totalBudget),
      channels: optimizedResult.channels,
      timeframe: `${timeframeFrom} - ${timeframeTo}`
    };
    
    toast.success("Optimization created successfully", {
      description: `${scenarioName} has been added to your scenarios list.`,
    });
    
    onComplete(newScenario);
  };

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, percentage, value } = props;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2 }}
        />
        {width > 70 && height > 60 ? (
          <>
            <text x={x + width / 2} y={y + height / 2 - 12} textAnchor="middle" fill="#fff" fontWeight="bold">
              {name}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="#fff">
              {percentage}%
            </text>
          </>
        ) : null}
      </g>
    );
  };

  const renderStep1Content = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Set Optimization Constraints</h2>
        <p className="text-muted-foreground">Define your budget constraints and targets for the AI to optimize</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Optimization Name</Label>
              <Input 
                id="name" 
                value={scenarioName} 
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Enter optimization name"
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
            
            <div className="space-y-2">
              <Label>Target KPI</Label>
              <RadioGroup value={targetKpi} onValueChange={setTargetKpi} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="roi" id="roi" />
                  <Label htmlFor="roi" className="cursor-pointer">ROI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="turnover" id="turnover" />
                  <Label htmlFor="turnover" className="cursor-pointer">Turnover</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profit" id="profit" />
                  <Label htmlFor="profit" className="cursor-pointer">Profit</Label>
                </div>
              </RadioGroup>
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
            
            <div className="flex items-center space-x-2 pt-4">
              <Switch 
                id="override" 
                checked={overrideConstraints} 
                onCheckedChange={setOverrideConstraints}
              />
              <Label htmlFor="override">Allow AI to override constraints if ROI improves</Label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Channel Constraints</h3>
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {channels.map((channel, index) => (
                <div key={index} className="bg-muted/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{channel.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`freeze-${channel.name}`} 
                        checked={channel.frozen} 
                        onCheckedChange={(checked) => handleChannelFrozenChange(channel.name, checked)}
                      />
                      <Label htmlFor={`freeze-${channel.name}`} className="text-sm">
                        {channel.frozen ? "Frozen" : "Adjustable"}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Minimum (%)</Label>
                        <span className="text-sm font-medium">{channel.minPercent}%</span>
                      </div>
                      <Slider 
                        disabled={channel.frozen}
                        value={[channel.minPercent]} 
                        min={0} 
                        max={100} 
                        step={1} 
                        onValueChange={(value) => handleChannelMinChange(channel.name, value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm">Maximum (%)</Label>
                        <span className="text-sm font-medium">{channel.maxPercent}%</span>
                      </div>
                      <Slider 
                        disabled={channel.frozen}
                        value={[channel.maxPercent]} 
                        min={0} 
                        max={100} 
                        step={1}
                        onValueChange={(value) => handleChannelMaxChange(channel.name, value)}
                      />
                    </div>
                    
                    {channel.frozen && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Current budget: €{channel.currentBudget.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2Content = () => {
    if (!optimizedResult) return null;
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center text-green-600">
          <CheckCircle className="mr-2 h-6 w-6" />
          Optimization Complete
        </h2>
        <p className="text-muted-foreground">The AI has optimized your budget allocation for maximum {targetKpi.toUpperCase()}</p>
        
        <Card>
          <CardHeader>
            <CardTitle>Optimized Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={optimizedResult.channels}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={<CustomizedContent />}
                >
                  <Tooltip
                    formatter={(value) => [`€${Number(value).toLocaleString()}`, "Budget"]}
                    labelFormatter={(name) => `${name}`}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimizedResult.channels.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">€{item.size.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">€{optimizedResult.totalBudget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 bg-muted/20 p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-2">Optimization Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated ROI:</p>
                  <p className="font-medium text-xl">{optimizedResult.roi}x</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated Contribution:</p>
                  <p className="font-medium text-xl">€{optimizedResult.contribution.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create Optimization</h1>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
      
      <div className="mb-8">
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
            <div 
              className="bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-around">
            <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-xs mt-1">Set Constraints</span>
            </div>
            
            <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-xs mt-1">Review Optimization</span>
            </div>
          </div>
        </div>
      </div>
      
      {currentStep === 1 ? renderStep1Content() : renderStep2Content()}
      
      <div className="mt-8 flex justify-between">
        {currentStep === 1 ? (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleOptimize}>Run Optimization</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Edit Constraints
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => {
                toast.info("Optimization saved as draft", {
                  description: `${scenarioName} has been saved as a draft.`
                });
                onClose();
              }}>
                Save Draft
              </Button>
              <Button onClick={handleSubmitOptimization}>
                Save Optimization
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateOptimization;
