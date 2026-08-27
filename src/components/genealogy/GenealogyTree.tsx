import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Users, ArrowUp, Home, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import TreeNode, { TreeNodeData } from './TreeNode';

interface TreeApiResponse {
  data: TreeNodeData;
}

const fetchTreeData = async (depth: number = 3, memberId?: string): Promise<TreeNodeData> => {
  const endpoint = memberId 
    ? `/api/v1/user/tree/${memberId}?depth=${depth}`
    : `/api/v1/user/tree_view?depth=${depth}`;
  const response = await api.get<TreeApiResponse>(endpoint);
  return response.data.data;
};

const TreeLegend = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="flex flex-wrap gap-3 text-xs"
  >
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/50" />
      <span className="text-muted-foreground">Active</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full border-2 border-dashed border-border bg-muted/30" />
      <span className="text-muted-foreground">Empty</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-chart-4 ring-2 ring-chart-4/50" />
      <span className="text-muted-foreground">Crown</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-chart-2 ring-2 ring-chart-2/50" />
      <span className="text-muted-foreground">Gold</span>
    </div>
  </motion.div>
);

const TreeSkeleton = () => (
  <div className="flex flex-col items-center py-8">
    <Skeleton className="w-16 h-16 rounded-full" />
    <Skeleton className="w-20 h-12 mt-2 rounded-lg" />
    <Skeleton className="w-14 h-5 mt-1 rounded-full" />
    
    <div className="flex gap-16 mt-12">
      <div className="flex flex-col items-center">
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-16 h-10 mt-2 rounded-lg" />
      </div>
      <div className="flex flex-col items-center">
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-16 h-10 mt-2 rounded-lg" />
      </div>
    </div>
  </div>
);

// Breadcrumb for navigation history
const NavigationBreadcrumb = ({ 
  history, 
  onNavigate,
  onReset 
}: { 
  history: Array<{ id: string; name: string }>;
  onNavigate: (id: string) => void;
  onReset: () => void;
}) => {
  if (history.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 flex-wrap"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-1.5 h-8 bg-background/80 backdrop-blur-sm"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">My Network</span>
      </Button>
      
      {history.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="text-muted-foreground">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className={cn(
              'h-8 px-2',
              index === history.length - 1 && 'text-primary font-medium'
            )}
          >
            {item.name}
          </Button>
        </div>
      ))}
    </motion.div>
  );
};

// Custom Depth Input Control Component
const DepthControlCard = ({ 
  depth, 
  onApply 
}: { 
  depth: number; 
  onApply: (depth: number) => void;
}) => {
  const [inputValue, setInputValue] = useState(depth.toString());
  const [warning, setWarning] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setWarning(null);
    } else if (numValue > 10) {
      setWarning('Maximum depth is 10 levels');
    } else if (numValue < 1) {
      setWarning('Minimum depth is 1 level');
    } else {
      setWarning(null);
    }
  };

  const handleApply = () => {
    let numValue = parseInt(inputValue, 10);
    
    if (isNaN(numValue) || numValue < 1) {
      numValue = 1;
    } else if (numValue > 10) {
      numValue = 10;
    }
    
    setInputValue(numValue.toString());
    setWarning(null);
    onApply(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-foreground">Tree Depth Control</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-[180px]">
            <Label htmlFor="tree-depth" className="text-xs text-muted-foreground mb-1.5 block">
              Tree Depth:
            </Label>
            <Input
              id="tree-depth"
              type="number"
              min={1}
              max={10}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={cn(
                'h-9',
                warning && 'border-destructive focus-visible:ring-destructive/50'
              )}
            />
          </div>
          <Button
            onClick={handleApply}
            size="sm"
            className="h-9 px-4"
          >
            Apply
          </Button>
        </div>
        
        {warning ? (
          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {warning}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            Enter 1-10 levels. Higher depth shows more generations but may affect performance.
          </p>
        )}
        
        {/* Quick select buttons */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground mr-1 self-center">Quick:</span>
          {[2, 3, 5, 7, 10].map((d) => (
            <Button
              key={d}
              variant={depth === d ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setInputValue(d.toString());
                setWarning(null);
                onApply(d);
              }}
              className="h-7 px-2 text-xs"
            >
              {d}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const GenealogyTree = () => {
  const [depth, setDepth] = useState(3);
  const [currentRootId, setCurrentRootId] = useState<string | undefined>(undefined);
  const [navigationHistory, setNavigationHistory] = useState<Array<{ id: string; name: string }>>([]);

  const { 
    data: treeData, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['genealogyTree', depth, currentRootId],
    queryFn: () => fetchTreeData(depth, currentRootId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const handleNodeClick = (memberId: string) => {
    // Don't navigate if clicking on current root
    if (memberId === currentRootId) return;
    
    // Find the node name from current tree data
    const findNodeName = (node: TreeNodeData | null, targetId: string): string | null => {
      if (!node) return null;
      if (node.memberId === targetId) return node.fullName;
      return findNodeName(node.left, targetId) || findNodeName(node.right, targetId);
    };

    const nodeName = treeData ? findNodeName(treeData, memberId) : memberId;
    
    setNavigationHistory(prev => [...prev, { id: memberId, name: nodeName || memberId }]);
    setCurrentRootId(memberId);
  };

  const handleNavigateToHistoryItem = (memberId: string) => {
    const itemIndex = navigationHistory.findIndex(item => item.id === memberId);
    if (itemIndex !== -1) {
      setNavigationHistory(prev => prev.slice(0, itemIndex + 1));
      setCurrentRootId(memberId);
    }
  };

  const handleResetToMyNetwork = () => {
    setNavigationHistory([]);
    setCurrentRootId(undefined);
  };

  const isDrilledDown = currentRootId !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Genealogy Tree</h1>
          <p className="text-muted-foreground">
            {isDrilledDown 
              ? 'Viewing member network - click nodes to drill deeper'
              : 'View your binary network structure'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isDrilledDown && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToMyNetwork}
              className="gap-2"
            >
              <ArrowUp className="h-4 w-4" />
              Back to Top
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Breadcrumb */}
      {navigationHistory.length > 0 && (
        <NavigationBreadcrumb 
          history={navigationHistory}
          onNavigate={handleNavigateToHistoryItem}
          onReset={handleResetToMyNetwork}
        />
      )}

      {/* Main Tree Card */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="border-b border-border bg-card/50 backdrop-blur-sm flex flex-row items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-foreground">
              {isDrilledDown ? 'Member Network' : 'Your Network'} (Binary Tree)
            </CardTitle>
          </div>
          <TreeLegend />
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[700px] p-8 flex justify-center">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TreeSkeleton />
                  </motion.div>
                ) : isError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-12 text-center"
                  >
                    <div className="p-4 rounded-full bg-destructive/10 mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Failed to load tree</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      {(error as Error)?.message || 'Unable to fetch network data. Please try again.'}
                    </p>
                    <Button onClick={() => refetch()} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </motion.div>
                ) : treeData ? (
                  <motion.div
                    key={currentRootId || 'root'}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TreeNode 
                      node={treeData} 
                      level={0} 
                      maxLevel={depth} 
                      onNodeClick={handleNodeClick}
                      isRoot
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No network data available
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Depth Control */}
      <DepthControlCard depth={depth} onApply={setDepth} />

      {/* Rank Legend */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Rank Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Crown Diamond', style: 'bg-chart-4 text-foreground' },
              { name: 'Diamond', style: 'bg-chart-1 text-primary-foreground' },
              { name: 'Platinum', style: 'bg-chart-3 text-primary-foreground' },
              { name: 'Gold', style: 'bg-chart-2 text-foreground' },
              { name: 'Silver', style: 'bg-muted text-muted-foreground' },
              { name: 'Bronze', style: 'bg-secondary text-secondary-foreground' },
              { name: 'Associate', style: 'bg-primary text-primary-foreground' },
            ].map((rank) => (
              <Badge
                key={rank.name}
                variant="outline"
                className={cn('text-xs border-0', rank.style)}
              >
                {rank.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenealogyTree;
