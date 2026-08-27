import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Bell, Globe, Baby, Scale, Mail } from 'lucide-react';
import { useEffect } from 'react';

interface Section {
  icon: React.ReactNode;
  title: string;
  content: string[];
}

const sections: Section[] = [
  {
    icon: <Database className="h-5 w-5" />,
    title: 'Information We Collect',
    content: [
      'Personal Identification Information: Full name, email address, phone number, PAN card number, date of birth, and gender provided during registration.',
      'KYC Documents: Government-issued identity proof (Aadhaar Card, Voter ID, Passport, or Driving Licence) and address proof as required for KYC verification and payout processing.',
      'Financial Information: Bank account details (account number, IFSC code, bank name) for processing payouts and commissions.',
      'Transaction Data: Purchase history, order details, product preferences, wallet transactions, and payout records.',
      'Device & Usage Information: IP address, browser type, operating system, device identifiers, app version, and usage patterns collected automatically when you access our platform.',
      'Location Data: Approximate location information (with your consent) for delivery address autofill and service optimization.',
    ],
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'How We Use Your Information',
    content: [
      'Account Management: To create and manage your member account, verify your identity through KYC processes, and maintain your network/genealogy records.',
      'Order Fulfillment: To process product purchases, manage inventory, arrange delivery, and handle returns or exchanges as per our policies.',
      'Commission & Payout Processing: To calculate business volume (BV), point value (PV), matching income, and other bonus structures, and to disburse payouts to your registered bank account.',
      'Tax Compliance: To deduct TDS and applicable taxes as per prevailing Indian tax regulations and generate necessary tax documentation.',
      'Communication: To send order confirmations, payout notifications, OTP verifications, promotional offers, business updates, and important announcements via SMS, email, or in-app notifications.',
      'Platform Improvement: To analyze usage patterns, improve user experience, fix bugs, optimize performance, and develop new features.',
      'Legal Compliance: To comply with applicable laws, regulations, legal processes, and governmental requests under Indian jurisdiction.',
    ],
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Data Protection & Security',
    content: [
      'We implement industry-standard security measures including SSL/TLS encryption for all data transmission, encrypted storage of sensitive information, and secure server infrastructure.',
      'Access to personal data is restricted to authorized personnel only, and all employees and contractors are bound by confidentiality obligations.',
      'Passwords are hashed using strong one-way algorithms and are never stored in plain text. We encourage users to use strong, unique passwords.',
      'We conduct regular security audits and vulnerability assessments to maintain the integrity of our systems.',
      'Despite our best efforts, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security but strive to protect your data to the highest reasonable standard.',
    ],
  },
  {
    icon: <UserCheck className="h-5 w-5" />,
    title: 'Data Sharing & Disclosure',
    content: [
      'We do not sell, trade, or rent your personal information to third parties for marketing purposes.',
      'Service Providers: We may share data with trusted third-party service providers (payment gateways like Razorpay, cloud hosting via Cloudinary, SMS/OTP providers) who assist in operating our platform, strictly under confidentiality agreements.',
      'Sponsor/Upline: Your name, member ID, and business performance metrics may be visible to your sponsor and upline members within the network genealogy as part of the MLM business structure.',
      'Legal Requirements: We may disclose your information if required by law, court order, regulatory authority, or government request, or to protect our rights, property, or safety.',
      'Business Transfers: In the event of a merger, acquisition, or sale of assets, your data may be transferred to the succeeding entity, subject to the same privacy commitments.',
    ],
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: 'Cookies & Tracking Technologies',
    content: [
      'We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze site traffic.',
      'Essential Cookies: Required for basic platform functionality such as authentication, session management, and security.',
      'Analytics Cookies: Help us understand how users interact with our platform, which pages are most popular, and where users experience issues.',
      'You can manage cookie preferences through your browser settings. Disabling certain cookies may affect platform functionality.',
    ],
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: 'Your Rights & Choices',
    content: [
      'Access & Correction: You may access, review, and update your personal information through your dashboard profile settings at any time.',
      'Data Portability: You may request a copy of your personal data in a commonly used, machine-readable format.',
      'Withdrawal of Consent: You may withdraw consent for non-essential data processing by contacting us. Note that withdrawal of consent for essential services may result in account limitations.',
      'Account Deletion: You may request deletion of your account and associated data by contacting our support team. Certain data may be retained as required by law (e.g., tax records, transaction history) for a statutory period.',
      'Opt-Out: You can opt out of promotional communications by using the unsubscribe link in emails or adjusting notification preferences in your account settings.',
    ],
  },
  {
    icon: <Baby className="h-5 w-5" />,
    title: 'Children\'s Privacy',
    content: [
      'Our platform and services are not directed to individuals under the age of 18 years. As per our Terms & Conditions, every ID holder must be 18 years or above to register.',
      'We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal data, we will take immediate steps to delete such information.',
    ],
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Data Retention',
    content: [
      'We retain your personal data for as long as your account is active or as needed to provide you with our services.',
      'Transaction records, commission/payout history, and tax-related data are retained for a minimum of 8 years as required under Indian tax laws and the Companies Act.',
      'KYC documents are retained as per Reserve Bank of India (RBI) guidelines and applicable Anti-Money Laundering (AML) regulations.',
      'Upon account termination, data that is not legally required to be retained will be securely deleted or anonymized within a reasonable timeframe.',
    ],
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Updates to This Policy',
    content: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or business operations.',
      'Material changes will be communicated via email notification, in-app notice, or a prominent announcement on our website.',
      'Your continued use of the platform after any modifications constitutes acceptance of the updated Privacy Policy.',
      'We encourage you to review this policy periodically to stay informed about how we protect your data.',
    ],
  },
];

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-emerald-700 to-green-700">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative container mx-auto px-6 py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-white/70 mt-1.5 text-sm">Sarva Solution Vision Pvt. Ltd.</p>
            </div>
          </div>

          {/* Quick summary bar */}
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: <Lock className="h-3.5 w-3.5" />, text: 'Encrypted Data' },
              { icon: <Shield className="h-3.5 w-3.5" />, text: 'DPDPA Compliant' },
              { icon: <UserCheck className="h-3.5 w-3.5" />, text: 'Your Data, Your Control' },
            ].map((badge) => (
              <span
                key={badge.text}
                className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {badge.icon}
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {/* Effective date & intro */}
          <div className="mb-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <span className="text-teal-400 font-semibold text-sm tracking-wide uppercase">Effective Date</span>
              <span className="text-slate-400 text-sm">1st January 2026</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              Sarva Solution Vision Pvt. Ltd. ("Company", "we", "our", or "us") is committed to protecting and respecting
              your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal
              information when you use our website, mobile application ("SarvaSolution Vision"), and related services
              (collectively, the "Platform"). By accessing or using the Platform, you agree to the practices described in
              this policy.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-10 bg-slate-900/40 border border-slate-800/60 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Contents</h2>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {sections.map((section, index) => (
                <a
                  key={index}
                  href={`#section-${index}`}
                  className="text-slate-400 hover:text-teal-400 text-sm transition-colors py-1 flex items-center gap-2"
                >
                  <span className="text-teal-600 text-xs font-mono">{String(index + 1).padStart(2, '0')}</span>
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                id={`section-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-700/40 transition-colors duration-300"
              >
                {/* Section header */}
                <div className="flex items-center gap-4 px-6 py-4 bg-slate-900/80 border-b border-slate-800">
                  <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/30">
                    {section.icon}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-teal-500/60 text-xs font-mono font-bold">{String(index + 1).padStart(2, '0')}</span>
                    <h2 className="text-white font-semibold text-lg">{section.title}</h2>
                  </div>
                </div>

                {/* Section content */}
                <div className="px-6 py-5 space-y-3">
                  {section.content.map((point, pIdx) => (
                    <div key={pIdx} className="flex gap-3 group">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-teal-500/60 rounded-full mt-2 group-hover:bg-teal-400 transition-colors" />
                      <p className="text-slate-300 leading-relaxed text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Governing Law */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections.length * 0.04 }}
            className="mt-6 bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border border-teal-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-5 w-5 text-teal-400" />
              <h2 className="text-white font-semibold text-lg">Governing Law</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              This Privacy Policy is governed by and construed in accordance with the laws of India, including the
              Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures
              and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023
              (DPDPA). Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the courts
              in Kolkata, West Bengal, India.
            </p>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sections.length + 1) * 0.04 }}
            className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-teal-400" />
              <h2 className="text-white font-semibold text-lg">Contact Us</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider">Company</span>
                <p className="text-slate-200 mt-1 text-sm font-medium">Sarva Solution Vision Pvt. Ltd.</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider">Phone</span>
                <p className="text-slate-200 mt-1 text-sm">
                  <a href="tel:+919832775700" className="hover:text-teal-400 transition-colors">+91 98327 75700</a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-slate-500 text-sm">
              © 2026 Sarva Solution Vision Pvt. Ltd. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link to="/terms-and-conditions" className="text-slate-500 hover:text-teal-400 text-sm transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/" className="text-slate-500 hover:text-teal-400 text-sm transition-colors">
                Home
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
