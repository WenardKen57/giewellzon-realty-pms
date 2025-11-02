import InquiryForm from "../../components/layout/InquiryForm";

// Helper components for Lucide icons (for a cleaner look)
const IconMapPin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconPhone = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMail = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function Contact() {
  return (
    <div className="py-20 bg-gradient-to-b from-white to-gray-50 animate-fadeIn">
      <div className="w-full max-w-screen-xl px-4 mx-auto sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-16 text-center">
          {/* *** CHANGED: Title size reduced *** */}
          <h1 className="text-4xl font-bold text-green-800 md:text-5xl">
            Get in Touch
          </h1>
          <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-500">
            We're here to help. Reach out to us for any inquiries or to
            schedule a viewing.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-start">
          {/* Left Column: Inquiry Form Card */}
          <div className="p-8 transition-all duration-300 bg-white border border-gray-100 shadow-lg lg:col-span-2 rounded-2xl hover:shadow-xl">
            <h3 className="mb-6 text-2xl font-semibold text-green-800">
              Send us a Message
            </h3>
            <InquiryForm />
          </div>

          {/* Right Column: Contact Info Card */}
          <div className="relative p-8 overflow-hidden text-white transition-all duration-300 shadow-lg bg-green-700 rounded-2xl hover:shadow-xl hover:-translate-y-1">
            {/* Accent Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-green-200 opacity-75"></div>

            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-2xl font-semibold">Contact Information</h3>
                <p className="mt-2 text-sm text-green-100/90">
                  Visit our office or reach out through any of the following:
                </p>
              </div>
              <div className="pt-4 space-y-4 text-base border-t border-green-600/50">
                {/* Item 1: Address */}
                <div className="flex items-start gap-4">
                  <IconMapPin className="w-5 h-5 mt-1 text-green-200 shrink-0" />
                  <span>
                    Brgy. San Isidro, Cabanatuan City, Nueva Ecija, Philippines
                  </span>
                </div>
                {/* Item 2: Phone */}
                <div className="flex items-center gap-4">
                  <IconPhone className="w-5 h-5 text-green-200 shrink-0" />
                  <span>+63 966 752 7631</span>
                </div>
                {/* Item 3: Email */}
                <div className="flex items-center gap-4">
                  <IconMail className="w-5 h-5 text-green-200 shrink-0" />
                  <span>info@giewellzon.com</span>
                </div>
              </div>
            </div>

            {/* *** REMOVED: Mini-map Placeholder *** */}
          </div>
        </div>
      </div>
    </div>
  );
}