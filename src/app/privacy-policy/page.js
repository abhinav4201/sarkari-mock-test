import LegalPageLayout from "@/components/layout/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy | Sarkari Mock Test",
  description:
    "Read the Privacy Policy for Sarkari Mock Test to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title='Privacy Policy'>
      <div className="text-slate-900">
        <p>
          <strong>Last Updated:</strong> July 7, 2025
        </p>
        <p>
          Welcome to Sarkari Mock Test ("we," "our," or "us"). We are committed
          to protecting your privacy. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you visit
          our website and use our services. Please read this privacy policy
          carefully. If you do not agree with the terms of this privacy policy,
          please do not access the site.
        </p>

        <h2><strong>1. Information We Collect</strong></h2>
        <p>
          We may collect information about you in a variety of ways. The
          information we may collect on the Site includes:
        </p>
        <ul>
          <li>
            <strong>Personal Data:</strong> Personally identifiable information,
            such as your name and email address, that you voluntarily give to us
            when you register with the Site via Google Sign-In.
          </li>
          <li>
            <strong>Derivative Data:</strong> Information our servers
            automatically collect when you access the Site, such as your user
            ID, test results (scores, answers, time taken), and the dates and
            times of your activities.
          </li>
          <li>
            <strong>Phone Number Data (for OTP Verification):</strong> For
            features like our contact form, we may collect your phone number
            solely for the purpose of sending a one-time password (OTP) to
            verify your identity. This number is stored securely and is not used
            for marketing purposes.
          </li>
        </ul>

        <h2><strong>2. Use of Your Information</strong></h2>
        <p>
          Having accurate information about you permits us to provide you with a
          smooth, efficient, and customized experience. Specifically, we may use
          information collected about you via the Site to:
        </p>
        <ul>
          <li>Create and manage your account.</li>
          <li>
            Provide and deliver the services you request, like mock tests.
          </li>
          <li>
            Track your progress and display your test history and results.
          </li>
          <li>
            Monitor and analyze usage and trends to improve your experience with
            the Site.
          </li>
          <li>
            Respond to your comments, questions, and provide customer service.
          </li>
        </ul>

        <h2><strong>3. Disclosure of Your Information</strong></h2>
        <p>
          We do not share, sell, rent, or trade your personal information with
          third parties for their commercial purposes. We may share information
          we have collected about you in certain situations:
        </p>
        <ul>
          <li>
            <strong>By Law or to Protect Rights:</strong> If we believe the
            release of information about you is necessary to respond to legal
            process, to investigate or remedy potential violations of our
            policies, or to protect the rights, property, and safety of others,
            we may share your information as permitted or required by any
            applicable law, rule, or regulation.
          </li>
          <li>
            <strong>Third-Party Service Providers:</strong> We may share your
            information with third parties that perform services for us or on
            our behalf, including data analysis, hosting services (Firebase),
            and customer service.
          </li>
        </ul>

        <h2><strong>4. Security of Your Information</strong></h2>
        <p>
          We use administrative, technical, and physical security measures, such
          as those provided by Google Cloud and Firebase, to help protect your
          personal information. While we have taken reasonable steps to secure
          the personal information you provide to us, please be aware that
          despite our efforts, no security measures are perfect or impenetrable,
          and no method of data transmission can be guaranteed against any
          interception or other type of misuse.
        </p>

        <h2><strong>5. Your Rights and Choices</strong></h2>
        <p>
          You have certain rights regarding your personal information. You may
          at any time review or change the information in your account or
          terminate your account by contacting us using the contact information
          provided below. Upon your request to terminate your account, we will
          deactivate or delete your account and information from our active
          databases.
        </p>

        <h2><strong>6. Policy for Children</strong></h2>
        <p>
          We do not knowingly solicit information from or market to children
          under the age of 13. If you become aware of any data we have collected
          from children under age 13, please contact us using the contact
          information provided below.
        </p>

        <h2><strong>7. Changes to This Privacy Policy</strong></h2>
        <p>
          We may update this Privacy Policy from time to time in order to
          reflect, for example, changes to our practices or for other
          operational, legal, or regulatory reasons. We will notify you of any
          changes by updating the "Last Updated" date of this Privacy Policy.
        </p>

        <h2><strong>8. Contact Us</strong></h2>
        <p>
          If you have questions or comments about this Privacy Policy, please
          contact us through our <a href='/contact'>contact page</a>.
        </p>
      </div>
    </LegalPageLayout>
  );
}
