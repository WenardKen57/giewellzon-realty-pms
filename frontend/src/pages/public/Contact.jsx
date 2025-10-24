import InquiryForm from "../../components/layout/InquiryForm";

export default function Contact() {
  return (
    <div className="min-h-[80vh] py-12 bg-gradient-to-b from-brand-light to-white">
      <div className="container-page">
        <h1 className="text-3xl font-bold text-brand-primary">Contact Us</h1>
        <p className="mt-2 text-neutral-600 max-w-2xl">
          Have questions or want to schedule a viewing? Fill out the form below
          and our team will respond as soon as possible.
        </p>

        <div className="grid items-start gap-10 mt-10 md:grid-cols-[2fr_1fr]">
          {/* Inquiry Form */}
          <div className="max-w-2xl">
            <InquiryForm />
          </div>

          {/* Contact Info */}
          <div className="p-6 bg-brand-primary text-white rounded-2xl shadow-md space-y-3">
            <h3 className="text-lg font-semibold">Get in Touch</h3>
            <p className="text-sm text-brand-light/90">
              Visit our office or reach out through any of the following:
            </p>
            <div className="pt-2 space-y-1 text-sm">
              <p>
                🏢 Brgy. San Isidro, Cabanatuan City, Nueva Ecija, Philippines
              </p>
              <p>📞 +63 966 752 7631</p>
              <p>✉️ info@giewellzon.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
