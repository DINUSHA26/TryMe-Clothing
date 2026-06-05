"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Search, Plus, Download, RefreshCw, Key, Info, HelpCircle, CheckCircle, AlertTriangle, Link as LinkIcon, Trash2 } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ZohoSettings {
  clientId: string;
  hasSecret: boolean;
  accountsServer: string;
  listKey: string;
  isConnected: boolean;
}

export default function NewsletterAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("subscribers");
  
  // Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Zoho Settings State
  const [settings, setSettings] = useState<ZohoSettings>({
    clientId: "",
    hasSecret: false,
    accountsServer: "https://accounts.zoho.com",
    listKey: "",
    isConnected: false,
  });
  const [clientSecret, setClientSecret] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load Subscribers
  const fetchSubscribers = async (pageNum = page, searchVal = search) => {
    setIsSubsLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?page=${pageNum}&search=${encodeURIComponent(searchVal)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.data.subscribers);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error(data.error || "Failed to fetch subscribers");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load subscribers list.",
        variant: "destructive",
      });
    } finally {
      setIsSubsLoading(false);
    }
  };

  // Load Settings
  const fetchSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/zoho-settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        if (data.data.hasSecret) {
          setClientSecret("••••••••••••••••");
        }
      } else {
        throw new Error(data.error || "Failed to fetch settings");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load Zoho settings.",
        variant: "destructive",
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchSettings();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
    fetchSubscribers(1, e.target.value);
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingSub(true);
    try {
      const res = await fetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Subscriber Added",
          description: data.data.message || "Successfully subscribed email.",
        });
        setNewEmail("");
        setIsDialogOpen(false);
        fetchSubscribers(1, search);
      } else {
        throw new Error(data.error || "Failed to add subscriber");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add subscriber.",
        variant: "destructive",
      });
    } finally {
      setIsAddingSub(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/zoho-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: settings.clientId,
          clientSecret,
          accountsServer: settings.accountsServer,
          listKey: settings.listKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Settings Saved",
          description: "Zoho Campaigns configurations updated successfully.",
        });
        setSettings(data.data);
        if (data.data.hasSecret) {
          setClientSecret("••••••••••••••••");
        }
      } else {
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleConnectZoho = async () => {
    if (!authCode) {
      toast({
        title: "Error",
        description: "Please enter the Zoho authorization code.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/admin/zoho-settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Connected!",
          description: "Successfully authenticated with Zoho Campaigns.",
        });
        setAuthCode("");
        fetchSettings();
      } else {
        throw new Error(data.error || "Connection failed");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "Could not connect to Zoho Campaigns.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectZoho = async () => {
    if (!confirm("Are you sure you want to disconnect Zoho Campaigns? This will clear access tokens.")) return;
    
    setIsSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/zoho-settings/disconnect", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Disconnected",
          description: "Zoho Campaigns integration disconnected successfully.",
        });
        fetchSettings();
      } else {
        throw new Error(data.error || "Disconnection failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect.",
        variant: "destructive",
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await fetch("/api/admin/zoho-settings/test", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Connection OK",
          description: "Zoho Campaigns API is successfully connected and tokens are valid!",
        });
      } else {
        throw new Error(data.error || "Integration test failed");
      }
    } catch (error: any) {
      toast({
        title: "Integration Error",
        description: error.message || "Failed to communicate with Zoho Campaigns.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast({
        title: "Export Failed",
        description: "No subscribers available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["ID", "Email", "Subscribed At"];
    const rows = subscribers.map(sub => [
      sub.id,
      sub.email,
      new Date(sub.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate the Zoho OAuth authorize link
  const getZohoAuthLink = () => {
    if (!settings.clientId) return "#";
    const accountsServer = settings.accountsServer || "https://accounts.zoho.com";
    const scope = "ZohoCampaigns.contact.UPDATE,ZohoCampaigns.contact.READ";
    const redirectUri = process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || "https://tryme.lk/zoho-callback";
    return `${accountsServer}/oauth/v2/auth?scope=${scope}&client_id=${settings.clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=consent`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter & Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your newsletter subscribers and configure Zoho Campaigns integration
          </p>
        </div>
        <div className="flex gap-2">
          {settings.isConnected ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 flex items-center gap-1.5">
              <CheckCircle className="h-4.5 w-4.5" /> Zoho Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-3 py-1 flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5" /> Zoho Offline
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="zoho">Zoho Campaigns</TabsTrigger>
        </TabsList>

        {/* Tab 1: Subscribers */}
        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Newsletter Subscribers
                </CardTitle>
                <CardDescription>
                  View and manage customer emails registered on the store
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" /> Add Subscriber
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscriber</DialogTitle>
                      <DialogDescription>
                        Manually subscribe an email address to the newsletter list.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubscriber}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isAddingSub}>
                          {isAddingSub ? "Saving..." : "Add & Sync"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="flex items-center gap-2 pb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    className="pl-8"
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => fetchSubscribers(page, search)} disabled={isSubsLoading}>
                  <RefreshCw className={`h-4 w-4 ${isSubsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscribed At</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isSubsLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Loading subscribers...
                        </TableCell>
                      </TableRow>
                    ) : subscribers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No subscribers found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscribers.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.email}</TableCell>
                          <TableCell>{new Date(sub.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{new Date(sub.updatedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(prev => Math.max(prev - 1, 1));
                      fetchSubscribers(Math.max(page - 1, 1), search);
                    }}
                    disabled={page === 1 || isSubsLoading}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage(prev => Math.min(prev + 1, totalPages));
                      fetchSubscribers(Math.min(page + 1, totalPages), search);
                    }}
                    disabled={page === totalPages || isSubsLoading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Zoho Campaigns Settings */}
        <TabsContent value="zoho" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Configuration Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Zoho API Credentials
                  </CardTitle>
                  <CardDescription>
                    Configure server-based credentials generated inside Zoho API Console
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          placeholder="e.g. 1000.XXXXXXXXXXXXXXXXXXXXXXXXXX"
                          value={settings.clientId}
                          onChange={(e) => setSettings({ ...settings, clientId: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          type="password"
                          placeholder="Enter your Zoho client secret"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountsServer">Accounts Server / region</Label>
                        <Select
                          value={settings.accountsServer}
                          onValueChange={(val) => setSettings({ ...settings, accountsServer: val })}
                        >
                          <SelectTrigger id="accountsServer">
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="https://accounts.zoho.com">United States (com)</SelectItem>
                            <SelectItem value="https://accounts.zoho.eu">Europe (eu)</SelectItem>
                            <SelectItem value="https://accounts.zoho.in">India (in)</SelectItem>
                            <SelectItem value="https://accounts.zoho.com.au">Australia (com.au)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="listKey">Mailing List Key</Label>
                        <Input
                          id="listKey"
                          placeholder="Enter mailing list key"
                          value={settings.listKey}
                          onChange={(e) => setSettings({ ...settings, listKey: e.target.value })}
                          required
                        />
                        <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                          <Info className="h-3 w-3 mt-0.5 shrink-0" />
                          Found under Contacts &gt; Manage Lists &gt; Setup inside Zoho Campaigns
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Authorized Redirect URI</Label>
                      <Input
                        value={process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || "https://tryme.lk/zoho-callback"}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        This is the Redirect URI that must be registered in the Zoho API Console client setup.
                      </p>
                    </div>

                    <Button type="submit" disabled={isSettingsLoading}>
                      {isSettingsLoading ? "Saving..." : "Save API Credentials"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* OAuth Connection Status and Code Exchange */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary" />
                    Authentication Link & Connection
                  </CardTitle>
                  <CardDescription>
                    Authenticate with Zoho Campaigns and generate/exchange the authorization code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.isConnected ? (
                    <div className="space-y-4">
                      <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
                        <CheckCircle className="h-5 w-5" />
                        <AlertTitle className="font-bold">Integration Active!</AlertTitle>
                        <AlertDescription>
                          Your website is successfully connected to Zoho Campaigns. Subscriptions are automatically synced to the Zoho mailing list in real-time.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          onClick={handleTestConnection} 
                          variant="outline" 
                          disabled={isTestingConnection}
                          className="gap-1.5"
                        >
                          <RefreshCw className={`h-4 w-4 ${isTestingConnection ? "animate-spin" : ""}`} />
                          Test Connection
                        </Button>
                        <Button 
                          onClick={handleDisconnectZoho} 
                          variant="destructive"
                          disabled={isSettingsLoading}
                        >
                          Disconnect Zoho
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-600">
                        <Info className="h-5 w-5 text-yellow-600" />
                        <AlertTitle className="font-bold">OAuth Authentication Required</AlertTitle>
                        <AlertDescription>
                          Follow the instructions on the right to grant permissions, then paste the returned authorization code below.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row items-end gap-3">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="authCode" className="font-bold">Zoho Authorization Code</Label>
                            <Input
                              id="authCode"
                              placeholder="e.g. 1000.683f352e6ad07d970d38369f4c84104b.b69c598..."
                              value={authCode}
                              onChange={(e) => setAuthCode(e.target.value)}
                              disabled={!settings.clientId || !settings.hasSecret}
                            />
                          </div>
                          <Button 
                            onClick={handleConnectZoho} 
                            disabled={isConnecting || !settings.clientId || !settings.hasSecret || !authCode}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0"
                          >
                            {isConnecting ? "Connecting..." : "Exchange & Connect"}
                          </Button>
                        </div>
                        {(!settings.clientId || !settings.hasSecret) && (
                          <p className="text-xs text-red-500">
                            * Please save Client ID and Client Secret above first before connecting.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Setup Instructions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    How to Configure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-3">
                    <li>
                      Go to the <a href="https://api-console.zoho.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium underline hover:text-blue-600 inline-flex items-center gap-0.5">Zoho API Console <LinkIcon className="h-3 w-3" /></a> and register a <strong>Server-based Applications</strong> client.
                    </li>
                    <li>
                      Fill in:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs">
                        <li>Client Name: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">TryMe Web</code></li>
                        <li>Homepage URL: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">https://tryme.lk</code></li>
                        <li>Authorized Redirect URIs: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || "https://tryme.lk/zoho-callback"}</code></li>
                      </ul>
                    </li>
                    <li>
                      Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong> into the form on the left, select your Zoho accounts region, and click <strong>Save API Credentials</strong>.
                    </li>
                    <li>
                      {!settings.clientId || !settings.hasSecret ? (
                        <span className="text-yellow-600 font-medium">Please save your credentials first to unlock the authorization link.</span>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <span>Click the link below to grant website permission:</span>
                          <Button asChild size="sm" variant="outline" className="w-full text-blue-600 hover:text-blue-700 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 font-semibold gap-1">
                            <a href={getZohoAuthLink()} target="_blank" rel="noopener noreferrer">
                              Authorize Zoho campaigns <LinkIcon className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </li>
                    <li>
                      After clicking Authorize, you will be redirected to a URL matching:
                      <div className="bg-muted p-2 rounded text-[10px] select-all overflow-x-auto whitespace-pre-wrap font-mono mt-1 text-muted-foreground border">
                        {process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || "https://tryme.lk/zoho-callback"}?code=<strong>[YOUR_CODE]</strong>&location=us&...
                      </div>
                      Copy the code parameter from the browser URL, paste it into the <strong>Zoho Authorization Code</strong> input on the left, and click <strong>Exchange & Connect</strong>.
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
