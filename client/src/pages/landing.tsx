import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F7' }}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-6xl mx-auto px-12 py-12">
          
          {/* Top Right Navigation */}
          <div className="flex justify-end mb-16">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-black text-sm font-light">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Main Hero - Large Price */}
          <h1 className="text-center font-semibold mb-2" style={{ 
            fontSize: '3.75em', 
            lineHeight: '1.625', 
            color: '#474747',
            fontFamily: "'Source Sans 3', sans-serif",
            letterSpacing: '0.025rem'
          }}>
            $0.99
          </h1>

          {/* Subtitle */}
          <p className="text-center mb-4" style={{ 
            fontSize: '1.625em', 
            lineHeight: '1.25', 
            fontWeight: '500',
            color: '#474747',
            fontFamily: "'Source Sans 3', sans-serif",
            letterSpacing: '0.025rem'
          }}>
            e-commerce package, delivered same day!
          </p>

          {/* Description */}
          <p className="text-left mb-12 max-w-4xl" style={{ 
            fontSize: '1.125em', 
            lineHeight: '1.5', 
            fontWeight: '300',
            color: '#474747',
            fontFamily: "'Source Sans Pro', sans-serif"
          }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed cursus turpis a purus aliquam sagittis. Morbi mattis porta mattis. Proin et lacus cursus, posuere tellus eget, cursus magna. Pellentesque molestie aliquam dui sagittis viverra. Quisque in tempus leo, sed dictum ligula. Vivamus vehicula mauris sed lorem sodales, in vestibulum orci feugiat.
          </p>

          {/* CTA Button */}
          <div className="mb-16">
            <Link href="/login">
              <Button className="bg-gray-800 text-white hover:bg-gray-900 px-6 py-2 text-base font-normal">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Small Text */}
          <p className="text-center mb-16" style={{ 
            fontSize: '0.625em', 
            lineHeight: '1.625', 
            fontWeight: '300',
            color: '#474747',
            fontFamily: "'Source Sans Pro', sans-serif",
            letterSpacing: '0.025rem'
          }}>
            LOREM IPSUM DOLOR SIT AMET CONSECTETUR
          </p>

          {/* Image Placeholder */}
          <div className="w-full h-96 bg-gray-300 rounded mb-16 flex items-center justify-center">
            <img src="/image12.jpg" alt="Hero" className="w-full h-full object-cover rounded" />
          </div>

          {/* Fast Section */}
          <div className="text-center mb-16">
            <h2 className="mb-8" style={{ 
              fontSize: '2em', 
              lineHeight: '1.625', 
              fontWeight: '600',
              color: '#474747',
              fontFamily: "'Source Sans Pro', sans-serif",
              letterSpacing: '0.025rem'
            }}>
              Fast
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <p className="mb-1" style={{ 
                  fontSize: '1em', 
                  lineHeight: '1.625', 
                  fontWeight: '600',
                  color: '#474747',
                  fontFamily: "'Source Sans Pro', sans-serif",
                  letterSpacing: '0.025rem'
                }}>
                  Lorem ipsum dolor sit amet, consectetur.
                </p>
                <p style={{ 
                  fontSize: '1em', 
                  lineHeight: '1.125', 
                  fontWeight: '300',
                  color: '#474747',
                  fontFamily: "'Source Sans Pro', sans-serif"
                }}>
                  Sed cursus turpis a purus aliquam sagittis. Morbi mattis porta mattis. Proin et lacus cursus, posuere tellus eget, cursus magna.
                </p>
              </div>
              <div className="w-full h-48">
                <img src="/image03.png" alt="Fast delivery" className="w-full h-full object-cover rounded" />
              </div>
            </div>
          </div>

          {/* Second Feature */}
          <div className="text-center mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="w-full h-48 md:order-1">
                <img src="/image13.png" alt="Feature 2" className="w-full h-full object-cover rounded" />
              </div>
              <div className="text-left md:order-2">
                <p className="mb-1" style={{ 
                  fontSize: '1em', 
                  lineHeight: '1.625', 
                  fontWeight: '600',
                  color: '#474747',
                  fontFamily: "'Source Sans Pro', sans-serif",
                  letterSpacing: '0.025rem'
                }}>
                  Pellentesque molestie aliquam.
                </p>
                <p style={{ 
                  fontSize: '1em', 
                  lineHeight: '1.125', 
                  fontWeight: '300',
                  color: '#474747',
                  fontFamily: "'Source Sans Pro', sans-serif"
                }}>
                  Quisque in tempus leo, sed dictum ligula. Vivamus vehicula mauris sed lorem sodales, in vestibulum orci feugiat.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-center text-right mt-24">
            <p style={{ 
              fontSize: '0.875em', 
              lineHeight: '1.875', 
              fontWeight: '300',
              color: '#B3B3B3',
              fontFamily: "'Source Sans Pro', sans-serif",
              letterSpacing: '0.025rem'
            }}>
              © 2025 Quikpik Inc.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}