import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Package, Shield, Truck, Leaf, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6">
        <div className="text-2xl font-bold text-gray-800">Quikpik</div>
        <Link href="/login">
          <Button variant="ghost" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent h-10 px-4 py-2 text-gray-600 hover:text-black font-extrabold">
            Sign In
          </Button>
        </Link>
      </header>
      {/* Hero Section */}
      <section className="text-center px-8 py-16 max-w-4xl mx-auto">
        <h1 className="md:text-6xl text-gray-800 mb-6 text-[40px] font-semibold">
          E-commerce delivery for the<br />
          urban cities. Only $0.99,<br />
          delivered same day !
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Quikpik enables online stores to deliver to a network of local convenience stores, making it easy for their customers to collect parcels.
        </p>
        <Link href="/login">
          <Button className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg">
            Sign me up
          </Button>
        </Link>
        <p className="text-2xl font-semibold text-gray-700 mt-4">$0.99 per lb</p>
      </section>
      {/* How it works */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">How it works</h2>
          
          <div className="space-y-12">
            <div className="flex items-start space-x-4">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">STEP 1</h3>
                <p className="text-gray-600">Online stores install our plugin or Open API</p>
                <p className="text-gray-500 text-sm mt-1">If needed, Quikpik will also integrate with OMS' like Shipstation</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">STEP 2</h3>
                <p className="text-gray-600">Your customer shops online and chooses pickup at checkout instead of opting for home delivery.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">STEP 3</h3>
                <p className="text-gray-600">Your customer receives a confirmation email--it's time to pick up their parcel!</p>
                <ul className="text-gray-500 text-sm mt-2 space-y-1">
                  <li>- Email contains a unique pickup code</li>
                  <li>- Email generally received within a day of placing order</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">STEP 4</h3>
                <p className="text-gray-600">Your customer picks up the order</p>
                <ul className="text-gray-500 text-sm mt-2 space-y-1">
                  <li>- Pickup locations are local convenience stores</li>
                  <li>- Shows the shopkeeper their unique barcode to pick up the item. No need for ID.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Why Quikpik */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Why Quikpik?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h3 className="font-semibold text-gray-800 mb-2">Failed deliveries</h3>
              <p className="text-sm text-gray-600">Over 50% of urban professionals cite missed deliveries as a pain point (McKinsey, 2022)</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🥷</div>
              <h3 className="font-semibold text-gray-800 mb-2">NO Porch theft</h3>
              <p className="text-sm text-gray-600">Did you know 63% of American shoppers were a victim of package theft in 2023? (source: Forbes)</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🍃</div>
              <h3 className="font-semibold text-gray-800 mb-2">Sustainable</h3>
              <p className="text-sm text-gray-600">Did you know, 35% of customers are even willing to pay up to $2.00 more for a sustainable shipping option?</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-gray-800 mb-2">Discreet Shipping</h3>
              <p className="text-sm text-gray-600">80% of customers seek discretion for sensitive purchases (Morning Consult, 2023)</p>
            </div>
          </div>
        </div>
      </section>
      {/* Coverage */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Coverage</h2>
          <p className="text-xl text-gray-600 mb-8">93%+ reach in urban cities</p>
          
          <div className="flex justify-center space-x-8 flex-wrap">
            <span className="text-lg text-gray-700">New York</span>
            <span className="text-lg text-gray-700">Chicago</span>
            <span className="text-lg text-gray-700">Los Angeles</span>
            <span className="text-lg text-gray-700">Miami</span>
            <span className="text-lg text-gray-700">San Francisco</span>
          </div>
        </div>
      </section>
      {/* Customer Experience */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Customer Experience</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Tracking</h3>
              <p className="text-gray-600">show QR code to pickup</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Easy Returns (coming soon)</h3>
            </div>
          </div>
        </div>
      </section>
      {/* Get started */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Get started in 30 mins</h2>
          <p className="text-xl text-gray-600 mb-12">Interactive Dashboard</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Integrate with online stores,OMS, or our API</h3>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Deliver through our supply chain</h3>
            </div>
          </div>
        </div>
      </section>
      {/* Sign Up Form */}
      <section className="py-16 px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">E-commerce brands love us</h2>
          <h3 className="text-2xl font-semibold text-center text-gray-700 mb-8">Sign Up</h3>
          
          <form className="space-y-6">
            <input
              type="text"
              placeholder="Name"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <input
              type="text"
              placeholder="Company Name / Website link"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <input
              type="email"
              placeholder="Work Email"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <textarea
              placeholder="send details on what problem(s) are you trying to solve..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition"
            >
              JOIN
            </button>
          </form>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-100 py-12 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">San Francisco</h4>
              <p className="text-gray-600">Quikpik Technologies</p>
            </div>
            <div>
              <p className="text-gray-600">25 Penn Plaza, 15th Floor</p>
              <p className="text-gray-600">New York, NY 10001, US</p>
            </div>
          </div>
          <div className="text-center mt-8 text-gray-500">
            ©Quikpik 2025
          </div>
        </div>
      </footer>
    </div>
  );
}