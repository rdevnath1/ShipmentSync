import { Link } from "wouter";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Settings, FileText, HelpCircle } from "lucide-react";

export default function Tools() {
  return (
    <>
      <Header 
        title="Tools" 
        description="Useful tools and settings for your shipping operations"
      />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Rate Calculator */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Calculator className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <CardTitle>Rate Calculator</CardTitle>
                  <p className="text-sm text-muted-foreground">Calculate shipping costs</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get instant shipping rate quotes for different zones and package sizes.
              </p>
              <Link href="/app/rate-calculator">
                <Button className="w-full">
                  Open Calculator
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="text-emerald-600 dark:text-emerald-400" size={24} />
                </div>
                <div>
                  <CardTitle>Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">Account preferences</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your account settings, password, and display preferences.
              </p>
              <Link href="/app/settings">
                <Button className="w-full" variant="outline">
                  Open Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <CardTitle>Documentation</CardTitle>
                  <p className="text-sm text-muted-foreground">How-to guides</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Learn how to use Quikpik effectively with our step-by-step guides.
              </p>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <HelpCircle className="text-orange-600 dark:text-orange-400" size={24} />
                </div>
                <div>
                  <CardTitle>Support</CardTitle>
                  <p className="text-sm text-muted-foreground">Get help</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team for assistance with your shipping needs.
              </p>
              <Button className="w-full" variant="outline" disabled>
                Contact Support
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}