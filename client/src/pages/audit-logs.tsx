import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, AlertTriangle, CheckCircle, Clock, User, Activity, Server, ExternalLink } from "lucide-react";

interface AuditLog {
  id: number;
  organizationId?: number;
  userId?: number;
  action: string;
  resource?: string;
  resourceId?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  error?: string;
  duration?: number;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['/api/audit-logs', selectedOrgId],
    queryFn: async () => {
      const params = selectedOrgId ? `?organizationId=${selectedOrgId}&limit=200` : '?limit=200';
      const response = await fetch(`/api/audit-logs${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create_shipment':
      case 'batch_print':
        return <Activity className="h-4 w-4" />;
      case 'sync_shipstation_orders':
        return <ExternalLink className="h-4 w-4" />;
      case 'list_orders':
      case 'view_audit_logs':
        return <User className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (success: boolean, statusCode?: number, error?: string) => {
    if (success) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>;
    }
    
    if (statusCode && statusCode >= 400) {
      return <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {statusCode} Error
      </Badge>;
    }

    return <Badge variant="outline">
      <Clock className="h-3 w-3 mr-1" />
      Failed
    </Badge>;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="mr-2 h-6 w-6" />
            System Audit Logs
          </h1>
          <p className="text-muted-foreground">Monitor API requests, user actions, and system events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedOrgId === undefined ? "default" : "outline"}
            onClick={() => setSelectedOrgId(undefined)}
            size="sm"
          >
            All Organizations
          </Button>
          <Button
            variant={selectedOrgId === 1 ? "default" : "outline"}
            onClick={() => setSelectedOrgId(1)}
            size="sm"
          >
            Master Org
          </Button>
          <Button
            variant={selectedOrgId === 2 ? "default" : "outline"}
            onClick={() => setSelectedOrgId(2)}
            size="sm"
          >
            Demo Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activity ({auditLogs.length} records)</span>
            <Badge variant="outline">{selectedOrgId ? `Org ID: ${selectedOrgId}` : 'All Organizations'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Status</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[100px]">Resource</TableHead>
                  <TableHead className="w-[80px]">Method</TableHead>
                  <TableHead className="min-w-[200px]">Endpoint</TableHead>
                  <TableHead className="w-[80px]">Duration</TableHead>
                  <TableHead className="w-[100px]">IP Address</TableHead>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead className="w-[60px]">Org ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: AuditLog) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell>
                      {getStatusBadge(log.success, log.statusCode, log.error)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.resource || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.method === 'POST' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {log.endpoint}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm ${log.duration && log.duration > 2000 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {formatDuration(log.duration)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{log.ipAddress || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.organizationId || '-'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {auditLogs.length === 0 && (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {selectedOrgId 
                  ? `No logs found for organization ${selectedOrgId}` 
                  : 'No system activity has been logged yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}