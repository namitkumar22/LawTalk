import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "../legal.module.css";

export const metadata = {
  title: "Privacy Policy — LawTalk",
  description: "LawTalk's Privacy Policy explaining how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  const lastUpdated = "April 8, 2026";

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          </div>

          <div className={styles.content}>
            <div className={styles.notice}>
              This Privacy Policy explains how LawTalk Technologies Private Limited ("LawTalk", "we", "us", or "our") collects, uses, shares, and protects your personal information when you use our platform. We are committed to protecting your privacy in accordance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 and applicable Indian data protection laws.
            </div>

            <section className={styles.section}>
              <h2>1. Information We Collect</h2>
              <h3 className={styles.subheading}>1.1 From Users (General Users)</h3>
              <ul>
                <li><strong>Registration Information:</strong> Full name, mobile number, email address (optional), date of birth, city, state</li>
                <li><strong>Verification Information:</strong> Last 4 digits of Aadhaar card (for anti-spam identity verification only — we do not store your full Aadhaar number)</li>
                <li><strong>Profile Information:</strong> Any additional information you choose to provide</li>
                <li><strong>Communication Data:</strong> Chat messages and consultation records</li>
                <li><strong>Payment Information:</strong> Transaction records (we do not store full payment card details)</li>
                <li><strong>Device Information:</strong> IP address, device type, browser type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, session duration</li>
              </ul>

              <h3 className={styles.subheading}>1.2 From Lawyers</h3>
              <ul>
                <li>All information as for Users above, plus:</li>
                <li><strong>Professional Information:</strong> Bar Council enrollment number, specializations, experience, education details, biography</li>
                <li><strong>Documents:</strong> Law degree/marksheet, Bar Council enrollment certificate, government-issued ID proof</li>
                <li><strong>Financial Information:</strong> Bank account details for payment remittance (collected securely and stored encrypted)</li>
                <li><strong>Professional History:</strong> Consultation records, ratings, reviews received</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>2. How We Use Your Information</h2>
              <ul>
                <li><strong>Platform Services:</strong> To provide, maintain, and improve our services, including matching Users with Lawyers</li>
                <li><strong>Identity Verification:</strong> To verify that Lawyers are authentic and qualified, and to prevent spam/fraudulent user accounts</li>
                <li><strong>Communication:</strong> To facilitate chat between Users and Lawyers, and to send platform notifications</li>
                <li><strong>Payments:</strong> To process consultation fees and remit payments to Lawyers</li>
                <li><strong>Customer Support:</strong> To respond to queries and resolve disputes</li>
                <li><strong>Safety &amp; Security:</strong> To detect and prevent fraud, unauthorized access, and violations of our Terms</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws, court orders, and regulatory requirements</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve our platform (anonymized/aggregated)</li>
                <li><strong>Marketing:</strong> To send relevant information about our services, with your prior consent</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>3. Information Sharing &amp; Disclosure</h2>
              <p>We do not sell your personal information to third parties. We may share your information with:</p>
              <ul>
                <li><strong>Other Platform Users:</strong> Lawyers see User names and consultation details; Users see Lawyer profiles. Chat contents are visible to both parties.</li>
                <li><strong>Payment Processors:</strong> To process payments (e.g., Razorpay, PhonePe). These processors have their own privacy policies.</li>
                <li><strong>Cloud Service Providers:</strong> For data storage and infrastructure (bound by confidentiality agreements)</li>
                <li><strong>Admin Team:</strong> Our internal admin team reviews Lawyer applications and documents for verification</li>
                <li><strong>Law Enforcement:</strong> When required by law, court order, or to protect rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, with appropriate notice to you</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>4. Sensitive Personal Data</h2>
              <p>Under the IT (SPDI) Rules, 2011, the following information you provide is considered Sensitive Personal Data:</p>
              <ul>
                <li>Financial information (payment data)</li>
                <li>Biometric data (Aadhaar last 4 digits — treated with heightened security)</li>
                <li>Any health or medical information shared during legal consultations</li>
              </ul>
              <p>We collect and process this information only with your explicit consent, which you provide during registration. You may withdraw your consent, but this may affect your ability to use the platform.</p>
            </section>

            <section className={styles.section}>
              <h2>5. Data Security</h2>
              <p>We implement industry-standard security measures to protect your personal information:</p>
              <ul>
                <li>TLS/SSL encryption for all data transmission</li>
                <li>AES-256 encryption for sensitive data at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Restricted access controls — only authorized personnel can access user data</li>
                <li>Secure document storage for Lawyer verification documents</li>
                <li>OTP-based authentication to prevent unauthorized account access</li>
              </ul>
              <p>Despite our security measures, no internet transmission is completely secure. We cannot guarantee absolute security of your information.</p>
            </section>

            <section className={styles.section}>
              <h2>6. Data Retention</h2>
              <ul>
                <li><strong>Active accounts:</strong> Data retained for the duration of your account and 3 years after deletion</li>
                <li><strong>Consultation records:</strong> Retained for 7 years (for legal compliance)</li>
                <li><strong>Lawyer verification documents:</strong> Retained for 5 years after account deletion</li>
                <li><strong>Payment records:</strong> Retained for 8 years (for tax and regulatory compliance)</li>
                <li><strong>Anonymized analytics data:</strong> Retained indefinitely</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>7. Your Rights</h2>
              <p>Under applicable Indian data protection law, you have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal information we hold</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated personal data (subject to legal retention requirements)</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for optional data processing (may affect certain features)</li>
                <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              </ul>
              <p>To exercise these rights, contact us at privacy@lawtalk.in. We will respond within 30 days.</p>
            </section>

            <section className={styles.section}>
              <h2>8. Cookies &amp; Tracking</h2>
              <p>We use cookies and similar technologies for:</p>
              <ul>
                <li><strong>Essential cookies:</strong> Required for platform functionality (authentication, security)</li>
                <li><strong>Performance cookies:</strong> To analyze and improve platform performance</li>
                <li><strong>Functional cookies:</strong> To remember your preferences</li>
              </ul>
              <p>You can manage cookie preferences through your browser settings, but disabling essential cookies may impact platform functionality.</p>
            </section>

            <section className={styles.section}>
              <h2>9. Children's Privacy</h2>
              <p>LawTalk is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately at privacy@lawtalk.in.</p>
            </section>

            <section className={styles.section}>
              <h2>10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or prominent notice on the platform at least 7 days before the changes take effect. The "Last Updated" date at the top indicates when the policy was last revised.</p>
            </section>

            <section className={styles.section}>
              <h2>11. Grievance Officer</h2>
              <p>In accordance with the Information Technology Act, 2000 and rules made thereunder, the name and contact details of the Grievance Officer are:</p>
              <ul>
                <li><strong>Name:</strong> Grievance Officer, LawTalk Technologies Private Limited</li>
                <li><strong>Email:</strong> grievance@lawtalk.in</li>
                <li><strong>Address:</strong> New Delhi — 110001, India</li>
                <li><strong>Response Time:</strong> Within 30 days of receipt of complaint</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>12. Contact Us</h2>
              <p>For any privacy-related queries:</p>
              <ul>
                <li><strong>Email:</strong> privacy@lawtalk.in</li>
                <li><strong>General Support:</strong> support@lawtalk.in</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
