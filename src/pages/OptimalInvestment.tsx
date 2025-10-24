import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Treemap, 
  ResponsiveContainer, 
  Tooltip
} from "recharts";
import { BarChart3, TrendingUp, X } from "lucide-react";
import CreateSimulation from "@/components/simulations/CreateSimulation";
import CreateOptimization from "@/components/optimization/CreateOptimization";
import { useFilters } from "@/components/layout/Header";
import { toast } from "sonner";
import Footer from "@/components/layout/Footer";

const COLORS = ["#8884d8", "#55B78D", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

const OptimalInvestment = () => {
  const [showSimulation, setShowSimulation] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [scenarios, setScenarios] = useState([
    { id: 1, name: "Base Optimization", status: "completed", roi: 7.2, contribution: 145000, date: "2025-04-15", type: "optimization" },
    { id: 2, name: "Digital Focus", status: "completed", roi: 8.1, contribution: 152000, date: "2025-04-12", type: "simulation" },
    { id: 3, name: "Traditional Media", status: "completed", roi: 6.4, contribution: 138000, date: "2025-04-08", type: "simulation" },
    { id: 4, name: "Balanced Mix", status: "draft", roi: 7.8, contribution: 148000, date: "2025-04-02", type: "simulation" },
  ]);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [simulationData, setSimulationData] = useState([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalContribution, setTotalContribution] = useState(0);
  const [averageROI, setAverageROI] = useState(0);

  const [optimizedBudget, setOptimizedBudget] = useState([
    {
      name: "TV",
      size: 110000,
      percentage: 31.4
    },
    {
      name: "Digital",
      size: 95000,
      percentage: 27.1
    },
    {
      name: "Radio",
      size: 35000,
      percentage: 10.0
    },
    {
      name: "Print",
      size: 15000,
      percentage: 4.3
    },
    {
      name: "CRM",
      size: 45000,
      percentage: 12.9
    },
    {
      name: "Promo",
      size: 50000,
      percentage: 14.3
    }
  ]);

  const filters = useFilters();

  const handleAddScenario = (newScenario: any) => {
    setScenarios(prev => [newScenario, ...prev]);
    setShowSimulation(false);
    setShowOptimization(false);
    
    if (newScenario.type === "optimization" && newScenario.channels) {
      setOptimizedBudget(newScenario.channels);
    }
  };

  const handleViewScenario = (scenarioId: number) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    setSelectedScenario(scenarioId);
  };

  const calculateExpectedROI = (budget: number, channel: string) => {
    const baseROI = {
      tv: 7.2,
      digital: 8.5,
      radio: 6.8,
      print: 5.5,
      crm: 9.2,
      promo: 7.8
    }[channel.toLowerCase()] || 7.0;

    const multiplier = Math.log10(budget / 10000 + 1) / Math.log10(2);
    return Number((baseROI * multiplier).toFixed(2));
  };

  const handleBudgetChange = (channel: string, newBudget: number) => {
    setSimulationData(prev => {
      const newData = prev.map(item => {
        if (item.channel === channel) {
          const newROI = calculateExpectedROI(newBudget, channel);
          return {
            ...item,
            newBudget,
            expectedROI: newROI,
            expectedContribution: Math.round(newBudget * newROI)
          };
        }
        return item;
      });

      const totalInvestment = newData.reduce((sum, item) => sum + item.newBudget, 0);
      const totalContribution = newData.reduce((sum, item) => sum + item.expectedContribution, 0);
      const averageROI = Number((totalContribution / totalInvestment).toFixed(2));

      setTotalInvestment(totalInvestment);
      setTotalContribution(totalContribution);
      setAverageROI(averageROI);

      return newData;
    });
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

  if (showSimulation) {
    return (
      <MainLayout title="Create Simulation">
        <CreateSimulation 
          onClose={() => setShowSimulation(false)} 
          onComplete={handleAddScenario}
        />
      </MainLayout>
    );
  }

  if (showOptimization) {
    return (
      <MainLayout title="Create Optimization">
        <CreateOptimization 
          onClose={() => setShowOptimization(false)}
          onComplete={handleAddScenario}
        />
      </MainLayout>
    );
  }

  if (selectedScenario !== null) {
    const scenario = scenarios.find(s => s.id === selectedScenario);
    if (!scenario) return null;

    const scenarioChannels = [
      {
        name: "TV",
        size: Math.round(scenario.contribution * (0.2 + Math.random() * 0.15)),
        percentage: Math.round((0.2 + Math.random() * 0.15) * 100) / 10
      },
      {
        name: "Digital",
        size: Math.round(scenario.contribution * (0.15 + Math.random() * 0.15)),
        percentage: Math.round((0.15 + Math.random() * 0.15) * 100) / 10
      },
      {
        name: "Radio",
        size: Math.round(scenario.contribution * (0.05 + Math.random() * 0.1)),
        percentage: Math.round((0.05 + Math.random() * 0.1) * 100) / 10
      },
      {
        name: "Print",
        size: Math.round(scenario.contribution * (0.02 + Math.random() * 0.05)),
        percentage: Math.round((0.02 + Math.random() * 0.05) * 100) / 10
      },
      {
        name: "CRM",
        size: Math.round(scenario.contribution * (0.08 + Math.random() * 0.07)),
        percentage: Math.round((0.08 + Math.random() * 0.07) * 100) / 10
      },
      {
        name: "Promo",
        size: Math.round(scenario.contribution * (0.1 + Math.random() * 0.08)),
        percentage: Math.round((0.1 + Math.random() * 0.08) * 100) / 10
      }
    ];

    const totalPercentage = scenarioChannels.reduce((sum, channel) => sum + channel.percentage, 0);
    scenarioChannels.forEach(channel => {
      channel.percentage = Math.round((channel.percentage / totalPercentage) * 1000) / 10;
    });

    return (
      <MainLayout title={`Scenario: ${scenario.name}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">{scenario.name}</h2>
            <p className="text-muted-foreground">
              {scenario.type.charAt(0).toUpperCase() + scenario.type.slice(1)} created on {new Date(scenario.date).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedScenario(null)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{scenario.roi}x</div>
              <p className="text-muted-foreground text-sm mt-1">Performance metric</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{scenario.contribution.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm mt-1">Total expected revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{Math.round(scenario.contribution / scenario.roi).toLocaleString()}</div>
              <p className="text-muted-foreground text-sm mt-1">Total investment</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Channel Distribution</CardTitle>
            <CardDescription>
              Budget allocation across channels for this scenario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={scenarioChannels}
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
                    <TableHead className="text-right">Budget (€)</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarioChannels.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.size.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">€{scenarioChannels.reduce((sum, item) => sum + item.size, 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Footer />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Optimal Investment">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowSimulation(true)}>
          <CardHeader className="bg-muted/20">
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-2 h-6 w-6 text-primary" />
              Create a Simulation
            </CardTitle>
            <CardDescription>
              Run a what-if analysis based on different budget allocations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            <p className="text-muted-foreground">
              Simulate different budget scenarios without constraints. See how changing your budget allocation affects your overall marketing performance.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
                <span>Test incremental investments across channels</span>
              </li>
              <li className="flex items-center">
                <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
                <span>Recalculate contributions on the fly</span>
              </li>
              <li className="flex items-center">
                <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
                <span>Compare up to 5 scenarios at once</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setShowSimulation(true)}>Start Simulation</Button>
          </CardFooter>
        </Card>

        <Card className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowOptimization(true)}>
          <CardHeader className="bg-muted/20">
            <CardTitle className="flex items-center text-xl">
              <TrendingUp className="mr-2 h-6 w-6 text-primary" />
              Create an Optimization
            </CardTitle>
            <CardDescription>
              Let AI find the optimal budget allocation for maximum ROI
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            <p className="text-muted-foreground">
              Our AI algorithms will analyze your response curves and constraints to find the best budget allocation that maximizes your marketing ROI.
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
                <span>Set budget constraints and goals</span>
              </li>
              <li className="flex items-center">
                <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
                <span>Apply channel-specific minimums and maximums</span>
              </li>
              <li className="flex items-center">
                <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
                <span>Get actionable recommendations</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setShowOptimization(true)}>Start Optimization</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scenarios</CardTitle>
            <CardDescription>
              Your saved optimization scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => (
                  <TableRow key={scenario.id}>
                    <TableCell className="font-medium">{scenario.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        scenario.type === "optimization" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}>
                        {scenario.type === "optimization" ? "Optimization" : "Simulation"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        scenario.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {scenario.status === "completed" ? "Completed" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{scenario.roi}x</TableCell>
                    <TableCell className="text-right">€{scenario.contribution.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{new Date(scenario.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewScenario(scenario.id)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimized Budget Allocation</CardTitle>
            <CardDescription>
              Recommended budget distribution based on best performing scenario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={optimizedBudget}
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
                  {optimizedBudget.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">€{item.size.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">€{optimizedBudget.reduce((sum, item) => sum + item.size, 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </MainLayout>
  );
};

export default OptimalInvestment;
