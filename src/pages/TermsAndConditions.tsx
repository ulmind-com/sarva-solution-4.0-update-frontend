import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useEffect } from 'react';

const terms: string[] = [
  'To be eligible for registration, every ID holder must be 18 years plus and submit valid government-issued identity proof. Each member is permitted to register one ID for each PAN card.',
  'KYC approval is mandatory for receiving any payout from the Company.',
  'The minimum eligibility amount for bank transfer is ₹300. Payout will be processed within 4 working days from the closing date.',
  'TDS and other applicable charges will be deducted as per prevailing tax rules. An additional admin charge of 10% will also be applicable, and an extra deduction of up to 8% for repurchase may be applied, if applicable.',
  'To qualify for Matching Income, maintaining two active direct referrals — one on the left side and one on the right side — is mandatory.',
  'Product delivery charges, courier fees, and service charges, if applicable, shall be borne by the customer/distributor separately.',
  'All payments made towards products and services are non-refundable and non-returnable once processed.',
  'The Company reserves the right to modify, amend, update, or revise the marketing plan, policies, rules, terms and conditions, business structure, and matching income trimming at any time, as deemed necessary for business operations, legal compliance, and organizational requirements, with or without prior notice.',
  'Any kind of anti-company propaganda or illegal activities will not be tolerated at any point of time. In such a situation, the Company has the right to terminate the distributorship and ID number without any notice.',
  'Under the Star Matching Bonus Slab, ₹1,500 will be deducted from the 7th, 9th, 11th, 13th, and 15th pairs (Total Deduction: ₹7,500). Equivalent-value products based on MRP will be provided to the respective leader after deduction. The selection of products will be solely decided by the Company, and the products will be distributed during the next Achievement Seminar.',
];

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600">
        <div className="container mx-auto px-6 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Terms &amp; Conditions</h1>
              <p className="text-white/80 mt-1">Sarva Solution Vision Pvt. Ltd.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-slate-400 mb-8 leading-relaxed text-justify">
            Please read the following terms and conditions carefully before registering or
            participating in any activity with Sarva Solution Vision Pvt. Ltd.
          </p>

          <ol className="space-y-4">
            {terms.map((term, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-teal-600/50 transition-colors"
              >
                <span className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-slate-300 leading-relaxed text-justify">{term}</p>
              </motion.li>
            ))}
          </ol>

          <div className="mt-12 border-t border-slate-800 pt-6">
            <p className="text-slate-500 text-sm">
              © 2026 Sarva Solution Vision Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
