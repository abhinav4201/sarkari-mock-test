// src/app/dashboard/monetization/policy/page.js

import LegalPageLayout from "@/components/layout/LegalPageLayout";

export const metadata = {
  title: "Monetization Policy | Sarkari Mock Test",
};

export default function MonetizationPolicyPage() {
  return (
    <LegalPageLayout title='Creator Monetization Policy'>
      <div className='text-slate-900'>
        <p>
          <strong>Last Updated:</strong> July 15, 2025
        </p>
        <p>
          We are thrilled to offer our content creators an opportunity to earn
          rewards. To ensure a fair and high-quality platform for everyone, all
          user-submitted content is subject to the following monetization
          policy.
        </p>

        <h2>
          <strong>Eligibility Criteria</strong>
        </h2>
        <p>
          To be eligible to apply for monetization, a creator must meet the
          following minimum requirements:
        </p>
        <ul>
          <li>
            You must have at least{" "}
            <strong>hundred (100) unique, approved mock tests</strong> live on the
            platform. A test is considered "unique" if its title and questions
            are not substantially similar to other tests on the platform, as
            determined by our automated checks and manual review.
          </li>
          <li>
            Your tests must have collectively reached a total of at least{" "}
            <strong>2000 unique test takers</strong>. A "unique taker" is defined
            as a single registered user. No matter how many times the same user
            retakes your tests, they will only be counted once towards your
            total.
          </li>
          <li>
            Your account must be in good standing and not in violation of our
            Terms of Service.
          </li>
        </ul>

        <h2>
          <strong>Approval Process</strong>
        </h2>
        <p>
          Once you meet the eligibility criteria, you can apply for monetization
          through your dashboard. The admin team will then conduct a manual
          review of your account and content. We review for:
        </p>
        <ul>
          <li>
            <strong>Quality and Originality:</strong> Questions must be
            well-written, accurate, and original. Plagiarism or low-quality
            content will lead to rejection.
          </li>
          <li>
            <strong>User Engagement:</strong> We look for positive user feedback
            and ratings on your tests.
          </li>
          <li>
            <strong>Account Authenticity:</strong> We verify that your account
            activity appears genuine and is not an attempt to game the system by
            creating fake accounts or using automated means to inflate test
            taker statistics.
          </li>
        </ul>
        <p>
          The review process can take up to 14 business days. The admin team's
          decision is final.
        </p>

        <h2>
          <strong>Payment Terms</strong>
        </h2>
        <p>
          Once approved, your tests with a `monetizationStatus: 'approved'` will
          begin earning rewards. Payments are calculated monthly based on the
          number of unique takers and will be disbursed to the bank account you
          provide. A platform fee of 20% will be deducted from the gross
          earnings.
        </p>
      </div>
    </LegalPageLayout>
  );
}
