import {
  HeartHandshake,
  Users,
  Building,
  ShieldCheck,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";

// Component for Core Value Cards
function ValueCard({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center p-6 text-center bg-gray-50 rounded-lg shadow-sm">
      <div className="flex items-center justify-center w-12 h-12 mb-4 text-white rounded-full bg-brand-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}

// Component for Team Member Cards (No longer used, but can leave it in case you want to add it back)
function TeamCard({ name, title, imageUrl }) {
  return (
    <div className="text-center">
      <img
        src={imageUrl}
        alt={name}
        className="w-40 h-40 mx-auto mb-4 rounded-full object-cover shadow-md"
        onError={(e) => (e.target.src = 'https://placehold.co/400x400/e2e8f0/64748b?text=Photo')}
      />
      <h4 className="text-lg font-semibold">{name}</h4>
      <p className="text-sm text-brand-primary">{title}</p>
    </div>
  );
}

export default function About() {
  return (
    <div className="bg-white">
      {/* 1. Hero Section */}
      <div className="relative h-72 md:h-96">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          alt="Modern house"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full max-w-4xl px-4 mx-auto text-center text-white">
          <h1 className="text-3xl font-bold md:text-5xl">
            About Giewellzon Realty
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-200">
            Building communities and making real estate ownership accessible and
            rewarding for every Filipino.
          </p>
        </div>
      </div>

      {/* 2. Our Story Section */}
      <div className="py-16 md:py-24">
        <div className="grid max-w-6xl grid-cols-1 gap-12 px-4 mx-auto md:grid-cols-2 md:items-center">
          <div>
            <span className="text-sm font-semibold uppercase text-brand-primary">
              Our Story
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Your Trusted Partner in Property
            </h2>
            <p className="mt-4 text-gray-600">
              Founded on the principles of integrity and client-centered service,
              Giewellzon Realty has grown from a small agency into a leading
              property development and marketing company.
            </p>
            <p className="mt-4 text-gray-600">
              We are focused on delivering high-value, sustainable community
              projects. Our mission is to not just build houses, but to create
              homes and futures. We navigate the complexities of the real estate
              market so you don't have to, ensuring every transaction is smooth,
              transparent, and rewarding.
            </p>
          </div>
          <div className="order-first md:order-last">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1673&q=80"
              alt="Real estate team meeting"
              className="object-cover w-full h-full rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* 3. Core Values Section */}
      <div className="py-16 bg-gray-50 md:py-24">
        <div className="max-w-6xl px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-sm font-semibold uppercase text-brand-primary">
              Our Principles
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Our Core Values
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              These principles are the foundation of our company and guide every
              decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 lg:grid-cols-4">
            <ValueCard icon={HeartHandshake} title="Integrity">
              We believe in transparent and honest communication from the first
              handshake to the final signature.
            </ValueCard>
            <ValueCard icon={Users} title="Client-Centered Service">
              Your goals are our goals. We provide personalized service tailored
              to your unique needs and aspirations.
            </ValueCard>
            <ValueCard icon={ShieldCheck} title="Transparent Financing">
              We make real estate ownership accessible with clear,
              easy-to-understand financing options. No surprises.
            </ValueCard>
            <ValueCard icon={Building} title="Community Impact">
              We don't just build properties; we build sustainable communities
              designed for long-term growth and happiness.
            </ValueCard>
          </div>
        </div>
      </div>
    </div>
  );
}

