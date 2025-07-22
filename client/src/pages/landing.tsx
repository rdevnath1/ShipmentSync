import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div id="wrapper">
        <div id="main">
          <div className="inner max-w-5xl mx-auto px-12 py-12">
            
            {/* Header Navigation */}
            <div className="flex justify-between items-center mb-16">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Q</span>
                </div>
                <span className="text-black font-medium">Quikpik</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-black">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-black text-white hover:bg-gray-800">Get Started</Button>
                </Link>
              </div>
            </div>

            {/* Main Hero - Large Price */}
            <h1 className="text-center text-7xl md:text-8xl font-semibold text-gray-800 mb-2 tracking-tight">
              $0.99
            </h1>

            {/* Subtitle */}
            <p className="text-center text-3xl md:text-4xl text-gray-800 font-medium mb-12">
              e-commerce package, delivered same day!
            </p>

            {/* Description */}
            <p className="text-left text-lg text-gray-700 font-light leading-relaxed mb-12 max-w-4xl">
              Quikpik revolutionizes e-commerce shipping with ultra-fast delivery at unbeatable prices. 
              Starting at just $0.99, we connect your business to a nationwide network of fulfillment centers, 
              ensuring your customers receive their packages in 1-6 days. Our zone-based pricing model 
              provides transparent costs with no hidden fees, while seamless ShipStation integration 
              makes setup effortless.
            </p>

            {/* CTA Button */}
            <div className="mb-16">
              <Link href="/login">
                <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Small Text */}
            <p className="text-center text-xs text-gray-500 font-light tracking-wide mb-16">
              TRUSTED BY E-COMMERCE BUSINESSES NATIONWIDE
            </p>

            {/* Features Section */}
            <div className="space-y-16 mb-20">
              
              {/* Feature 1 */}
              <div className="text-center">
                <h2 className="text-4xl font-semibold text-gray-800 mb-8">Fast</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 mb-2">1-6 Day Delivery</p>
                    <p className="text-gray-700 font-light">
                      Zone-based delivery times ensure predictable shipping across all 50 states. 
                      Express options available for next-day delivery.
                    </p>
                  </div>
                  <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Shipping Map</span>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="w-full h-48 bg-gray-200 rounded md:order-1 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Integration Dashboard</span>
                  </div>
                  <div className="text-left md:order-2">
                    <p className="font-semibold text-gray-800 mb-2">ShipStation Integration</p>
                    <p className="text-gray-700 font-light">
                      Seamless integration with your existing e-commerce workflow. 
                      Import orders and create shipments in just a few clicks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 mb-2">Transparent Pricing</p>
                    <p className="text-gray-700 font-light">
                      No hidden fees or monthly subscriptions. Pay only for what you ship 
                      with clear zone-based pricing starting at $0.99.
                    </p>
                  </div>
                  <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Pricing Calculator</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Zone Coverage */}
            <div className="text-center mb-20">
              <h2 className="text-4xl font-semibold text-gray-800 mb-12">Coverage</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-800 mb-1">Zone 1-2</div>
                  <div className="text-sm text-gray-600">1-2 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-800 mb-1">Zone 3-4</div>
                  <div className="text-sm text-gray-600">2-3 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-800 mb-1">Zone 5-6</div>
                  <div className="text-sm text-gray-600">3-4 Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-800 mb-1">Zone 7-8</div>
                  <div className="text-sm text-gray-600">4-6 Days</div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center mb-16">
              <h2 className="text-3xl font-medium text-gray-800 mb-8">Ready to get started?</h2>
              <Link href="/login">
                <Button className="bg-black text-white hover:bg-gray-800 px-10 py-4 text-xl">
                  Start Shipping
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 font-light tracking-wide border-t border-gray-300 pt-8">
              © 2025 Quikpik. All rights reserved.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}