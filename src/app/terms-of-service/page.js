import LegalPageLayout from "@/components/layout/LegalPageLayout";

export const metadata = {
  title: "Terms of Service | Sarkari Mock Test",
  description:
    "Read the Terms of Service for using the Sarkari Mock Test platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title='Terms of Service'>
      <div className='text-slate-900'>
        <p>
          <strong>Last Updated:</strong> July 7, 2025
        </p>
        <p>
          Please read these Terms of Service ("Terms", "Terms of Service")
          carefully before using the Sarkari Mock Test website (the "Service")
          operated by us. Your access to and use of the Service is conditioned
          on your acceptance of and compliance with these Terms. These Terms
          apply to all visitors, users, and others who access or use the
          Service.
        </p>

        <h2>
          <strong>1. Accounts</strong>
        </h2>
        <p>
          When you create an account with us, you must provide us with
          information that is accurate, complete, and current at all times.
          Failure to do so constitutes a breach of the Terms, which may result
          in immediate termination of your account on our Service. You are
          responsible for safeguarding the password that you use to access the
          Service and for any activities or actions under your password, whether
          your password is with our Service or a third-party service.
        </p>

        <h2>
          <strong>2. Intellectual Property</strong>
        </h2>
        <p>
          The Service and its original content (excluding content provided by
          users), features, and functionality are and will remain the exclusive
          property of Sarkari Mock Test and its licensors. The Service is
          protected by copyright, trademark, and other laws of both India and
          foreign countries. Our trademarks and trade dress may not be used in
          connection with any product or service without our prior written
          consent.
        </p>

        <h2>
          <strong>3. User Conduct</strong>
        </h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any local, state, national, or international law.</li>
          <li>
            Engage in any activity that interferes with or disrupts the Service
            (or the servers and networks which are connected to the Service).
          </li>
          <li>
            Attempt to copy, duplicate, reproduce, sell, trade, or resell our
            Service for any purpose.
          </li>
          <li>
            Use any automated system, including without limitation "robots,"
            "spiders," or "offline readers," to access the Service in a manner
            that sends more request messages to the servers than a human can
            reasonably produce in the same period by using a conventional web
            browser.
          </li>
        </ul>

        <h2>
          <strong>4. Termination</strong>
        </h2>
        <p>
          We may terminate or suspend your account immediately, without prior
          notice or liability, for any reason whatsoever, including without
          limitation if you breach the Terms. Upon termination, your right to
          use the Service will immediately cease.
        </p>

        <h2>
          <strong>5. Disclaimer of Warranties; Limitation of Liability</strong>
        </h2>
        <p>
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do
          not warrant that the results that may be obtained from the use of the
          Service will be accurate or reliable. You expressly agree that your
          use of, or inability to use, the service is at your sole risk.
        </p>
        <p>
          In no case shall Sarkari Mock Test, our directors, officers,
          employees, affiliates, agents, contractors, interns, suppliers,
          service providers, or licensors be liable for any injury, loss, claim,
          or any direct, indirect, incidental, punitive, special, or
          consequential damages of any kind.
        </p>

        <h2>
          <strong>6. Governing Law</strong>
        </h2>
        <p>
          These Terms shall be governed and construed in accordance with the
          laws of India, without regard to its conflict of law provisions. Our
          failure to enforce any right or provision of these Terms will not be
          considered a waiver of those rights.
        </p>

        <h2>
          <strong>7. Changes</strong>
        </h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. We will provide notice of any changes by
          posting the new Terms on this page and updating the "Last Updated"
          date.
        </p>

        <h2>
          <strong>8. Contact Us</strong>
        </h2>
        <p>
          If you have any questions about these Terms, please contact us through
          our <a href='/contact'>contact page</a>.
        </p>
      </div>
    </LegalPageLayout>
  );
}
