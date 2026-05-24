import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "../legal.module.css";

export const metadata = {
  title: "Terms & Conditions — LawTalk",
  description: "Read LawTalk's Terms and Conditions governing the use of our legal consultation platform.",
};

export default function TermsPage() {
  const lastUpdated = "April 8, 2026";

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Terms &amp; Conditions</h1>
            <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          </div>

          <div className={styles.content}>
            <div className={styles.notice}>
              <strong>Important:</strong> Please read these Terms and Conditions carefully before using the LawTalk platform. By accessing or using LawTalk, you agree to be bound by these terms.
            </div>

            <section className={styles.section}>
              <h2>1. Introduction &amp; Acceptance of Terms</h2>
              <p>Welcome to LawTalk ("Platform", "we", "us", or "our"), a technology platform operated by LawTalk Technologies Private Limited, registered under the Companies Act, 2013, India. LawTalk provides a digital marketplace connecting individuals and businesses seeking legal advice ("Users") with independent legal practitioners ("Lawyers") registered on our platform.</p>
              <p>By creating an account, accessing, or using any part of our platform, you ("User") acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable laws and regulations of India, including but not limited to the Information Technology Act, 2000, the Advocates Act, 1961, and the Bar Council of India Rules.</p>
            </section>

            <section className={styles.section}>
              <h2>2. Platform Description &amp; Disclaimer</h2>
              <p>LawTalk is a technology intermediary platform as defined under the Information Technology Act, 2000. We provide a communication channel between Users and Lawyers but:</p>
              <ul>
                <li><strong>Do not provide legal advice ourselves.</strong> All legal advice is provided by independent lawyers registered on our platform.</li>
                <li><strong>Do not guarantee the accuracy or completeness</strong> of legal advice provided by lawyers on our platform.</li>
                <li><strong>Are not responsible for the outcome</strong> of any legal matter discussed or pursued based on consultations conducted through our platform.</li>
                <li><strong>Are not a law firm</strong> and are not authorized to provide legal advice.</li>
              </ul>
              <p>The advice provided through LawTalk should not be construed as a lawyer-client relationship in the formal legal sense, unless a formal engagement agreement is separately executed between the User and the Lawyer.</p>
            </section>

            <section className={styles.section}>
              <h2>3. User Registration &amp; Eligibility</h2>
              <p>To use LawTalk as a User, you must:</p>
              <ul>
                <li>Be at least 18 years of age</li>
                <li>Be a citizen or resident of India, or legally authorized to use services in India</li>
                <li>Provide accurate, complete, and current information during registration</li>
                <li>Verify your identity through your registered mobile number (OTP verification)</li>
                <li>Provide the last 4 digits of your Aadhaar card for anti-spam identity verification</li>
                <li>Not have a previously suspended or terminated LawTalk account</li>
              </ul>
              <p>By providing your Aadhaar last 4 digits, you consent to our anti-fraud verification process. We do not store, share, or transmit your full Aadhaar number. This information is used solely to prevent spam and fraudulent accounts.</p>
            </section>

            <section className={styles.section}>
              <h2>4. Lawyer Registration &amp; Verification</h2>
              <p>Lawyers wishing to register on LawTalk must:</p>
              <ul>
                <li>Be enrolled with a State Bar Council in India under the Advocates Act, 1961</li>
                <li>Hold a valid Certificate of Practice issued by their State Bar Council</li>
                <li>Submit genuine copies of: law degree/marksheet, Bar Council enrollment certificate, and government-issued photo ID</li>
                <li>Provide accurate Bar Council enrollment number</li>
                <li>Not be under suspension or facing disciplinary proceedings with any Bar Council</li>
              </ul>
              <p>All lawyer applications are manually reviewed by our admin team. LawTalk reserves the right to reject any application at its sole discretion. Lawyers who provide false or misleading information will have their accounts permanently terminated and may face legal action under applicable Indian law.</p>
            </section>

            <section className={styles.section}>
              <h2>5. Pricing &amp; Payment Terms</h2>
              <ul>
                <li><strong>First Consultation:</strong> Every User's first consultation with any Lawyer on LawTalk is priced at a flat ₹2 (Indian Rupees Two Only). This is LawTalk's introductory offer and applies to the first session with each lawyer.</li>
                <li><strong>Subsequent Consultations:</strong> Charged at the Lawyer's stated rate per chat, as set by the Lawyer themselves.</li>
                <li><strong>Payment Processing:</strong> All payments are processed through our integrated payment gateway. LawTalk collects payments on behalf of Lawyers and remits after deducting our platform commission.</li>
                <li><strong>Platform Commission:</strong> LawTalk charges a platform commission on each consultation. The exact commission percentage will be communicated to Lawyers during registration and may be updated with 30 days' notice.</li>
                <li><strong>Refund Policy:</strong> Refunds are subject to LawTalk's Refund Policy. Generally, consultation fees once charged are non-refundable unless there is a proven technical error on our part.</li>
                <li><strong>GST:</strong> Applicable GST will be charged on all transactions as per Indian tax law.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>6. Prohibited Conduct</h2>
              <p>Users and Lawyers are strictly prohibited from:</p>
              <ul>
                <li>Providing false, misleading, or fraudulent information</li>
                <li>Conducting transactions off-platform to circumvent payment processing</li>
                <li>Harassing, abusing, or threatening other users of the platform</li>
                <li>Sharing confidential information obtained through consultations</li>
                <li>Using the platform for any purpose that violates Indian law</li>
                <li>Attempting to manipulate reviews or ratings</li>
                <li>Creating multiple accounts to circumvent restrictions</li>
                <li>Using automated tools or bots to access the platform</li>
                <li>Soliciting clients for unauthorized legal practice</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>7. Confidentiality &amp; Professional Privilege</h2>
              <p>While LawTalk facilitates communication between Users and Lawyers, we acknowledge the importance of lawyer-client privilege under Indian law. However, Users should note:</p>
              <ul>
                <li>Conversations on LawTalk are stored on our servers for platform functionality purposes</li>
                <li>Formal legal professional privilege may not apply to communications on a technology platform unless a formal engagement agreement has been executed</li>
                <li>Users should not share highly sensitive information (criminal confessions, undisclosed tax information, etc.) through the platform chat</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>8. Intellectual Property</h2>
              <p>All content on the LawTalk platform, including but not limited to the logo, design, text, graphics, and software, is the intellectual property of LawTalk Technologies Private Limited and is protected under the Copyright Act, 1957, and other applicable Indian intellectual property laws. Users may not reproduce, distribute, or create derivative works without our express written consent.</p>
            </section>

            <section className={styles.section}>
              <h2>9. Limitation of Liability</h2>
              <p>To the maximum extent permitted by applicable law, LawTalk and its officers, directors, employees, and agents shall not be liable for:</p>
              <ul>
                <li>Any indirect, incidental, consequential, or punitive damages</li>
                <li>Loss or corruption of data</li>
                <li>The conduct or advice of lawyers on our platform</li>
                <li>Unauthorized access to your account or data</li>
                <li>Interruption or unavailability of the platform</li>
              </ul>
              <p>Our total liability shall not exceed the amount paid by you for the specific consultation giving rise to the claim.</p>
            </section>

            <section className={styles.section}>
              <h2>10. Governing Law &amp; Dispute Resolution</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any dispute arising from these Terms shall first be attempted to be resolved through mutual negotiation. If unresolved, disputes shall be subject to arbitration conducted in accordance with the Arbitration and Conciliation Act, 1996, with the seat of arbitration in New Delhi, India. The language of arbitration shall be English.</p>
            </section>

            <section className={styles.section}>
              <h2>11. Modifications to Terms</h2>
              <p>LawTalk reserves the right to modify these Terms at any time. We will notify Users of material changes via email or platform notification with at least 7 days' notice. Continued use of the platform after the effective date of changes constitutes acceptance of the modified Terms.</p>
            </section>

            <section className={styles.section}>
              <h2>12. Contact Us</h2>
              <p>For questions about these Terms, please contact us at:</p>
              <ul>
                <li><strong>Email:</strong> legal@lawtalk.in</li>
                <li><strong>Address:</strong> LawTalk Technologies Private Limited, New Delhi — 110001</li>
                <li><strong>Grievance Officer:</strong> For complaints under IT Act, Sec. 1(5): grievance@lawtalk.in</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
