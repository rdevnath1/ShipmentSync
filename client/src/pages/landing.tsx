import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Package, DollarSign, Shield, ArrowRight, Zap, Globe, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Quikpik</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              🚀 Now serving 50+ states with same-day shipping
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold text-slate-900 mb-6 leading-tight">
            <span className="text-green-600">$0.99</span>
          </h1>
          <p className="text-3xl md:text-4xl text-slate-800 font-semibold mb-8 leading-tight">
            e-commerce shipping,<br />
            <span className="text-blue-600">delivered lightning fast!</span>
          </p>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            The game-changing shipping platform that makes ultra-fast, incredibly affordable delivery 
            accessible to every e-commerce business. Coast to coast in 1-6 days, not weeks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/login">
              <Button size="lg" className="px-10 py-4 text-xl font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg">
                Start Shipping Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-10 py-4 text-xl font-semibold border-2 hover:bg-slate-50">
              Calculate Your Savings
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">99.9%</div>
              <div className="text-sm text-slate-600">Delivery Success</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">1-6</div>
              <div className="text-sm text-slate-600">Days Delivery</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">50+</div>
              <div className="text-sm text-slate-600">States Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-sm text-slate-600">Real-time Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Why E-commerce Leaders Choose Quikpik
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Built specifically for modern e-commerce businesses that demand reliable, lightning-fast, 
              and incredibly affordable shipping solutions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-green-200 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold">Revolutionary Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center text-base">
                  Starting at just <strong className="text-green-600">$0.99</strong> per package. 
                  Save up to 70% compared to traditional carriers with our transparent zone-based pricing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold">Lightning Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center text-base">
                  <strong>1-6 day delivery nationwide</strong> with predictable zone-based timing. 
                  Express options available for same-day and next-day delivery.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold">Seamless Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center text-base">
                  Plug-and-play integration with <strong>ShipStation</strong> and major e-commerce platforms. 
                  Start shipping in under 5 minutes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-red-200 hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold">Enterprise Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center text-base">
                  Real-time tracking with <strong>QP format</strong> numbers. Advanced analytics, 
                  delivery notifications, and 99.9% tracking accuracy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Connect Your Store</h3>
              <p className="text-slate-600">
                Link your ShipStation account and import your orders instantly.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Calculate Rates</h3>
              <p className="text-slate-600">
                Get instant shipping quotes with our zone-based rate calculator.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Ship & Track</h3>
              <p className="text-slate-600">
                Create shipments, print labels, and track packages in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zone Map Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Complete US Coverage
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Reliable delivery to all 50 states with predictable, zone-based timing. 
              Know exactly when your customers will receive their packages.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-xl border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-blue-600 mb-3">Zone 1-2</div>
                <div className="text-lg font-semibold text-slate-700 mb-2">1-2 Business Days</div>
                <div className="text-sm text-slate-600">Northeast & Mid-Atlantic</div>
                <div className="text-xs text-blue-600 mt-2 font-medium">Starting $0.99</div>
              </div>
              <div className="p-6 border-2 border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-green-600 mb-3">Zone 3-4</div>
                <div className="text-lg font-semibold text-slate-700 mb-2">2-3 Business Days</div>
                <div className="text-sm text-slate-600">Southeast & Midwest</div>
                <div className="text-xs text-green-600 mt-2 font-medium">Starting $1.99</div>
              </div>
              <div className="p-6 border-2 border-yellow-200 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-yellow-600 mb-3">Zone 5-6</div>
                <div className="text-lg font-semibold text-slate-700 mb-2">3-4 Business Days</div>
                <div className="text-sm text-slate-600">Central & Mountain</div>
                <div className="text-xs text-yellow-600 mt-2 font-medium">Starting $3.49</div>
              </div>
              <div className="p-6 border-2 border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-all">
                <div className="text-3xl font-bold text-red-600 mb-3">Zone 7-8</div>
                <div className="text-lg font-semibold text-slate-700 mb-2">4-6 Business Days</div>
                <div className="text-sm text-slate-600">West Coast & Alaska</div>
                <div className="text-xs text-red-600 mt-2 font-medium">Starting $4.48</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 mb-4">
                * Express shipping available for 1-day reduction in delivery time
              </p>
              <Link href="/login">
                <Button variant="outline" className="px-6 py-2">
                  <Globe className="mr-2 h-4 w-4" />
                  Calculate Exact Rates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Revolutionary Pricing That Changes Everything
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              No hidden fees. No monthly subscriptions. No minimum volume requirements. 
              Pay only for what you ship with transparent, zone-based pricing.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 border-2 border-blue-100 shadow-xl">
            <div className="text-center mb-8">
              <div className="text-6xl md:text-8xl font-black text-green-600 mb-4">$0.99</div>
              <p className="text-2xl font-semibold text-slate-800 mb-2">Starting Price Per Package</p>
              <p className="text-lg text-slate-600">Zone 1 • 1-day delivery • No setup fees</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">✅ What's Included:</h3>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Real-time tracking with QP format numbers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Seamless ShipStation integration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Customized shipping labels</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>24/7 customer support</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">💰 Cost Comparison:</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border">
                    <span className="text-slate-700">Traditional Carriers</span>
                    <span className="font-bold text-red-600">$8.50 - $15.00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <span className="text-slate-700 font-semibold">Quikpik Average</span>
                    <span className="font-bold text-green-600 text-lg">$2.84</span>
                  </div>
                  <div className="text-center text-sm text-slate-600 mt-2">
                    <strong className="text-green-600">Save up to 70%</strong> on every shipment
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link href="/login">
                <Button size="lg" className="px-12 py-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                  Start Saving Today - Free Setup
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-slate-500 mt-4">
                No credit card required • Setup in under 5 minutes • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">Q</span>
              </div>
              <h3 className="text-2xl font-bold">Quikpik</h3>
            </div>
            <p className="text-slate-400 mb-6">
              Revolutionizing e-commerce shipping with fast, affordable, reliable delivery.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-slate-400">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-700">
              <p className="text-slate-500 text-sm">
                © 2025 Quikpik. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}