import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, GRIEVANCE_OFFICER } from "@/lib/consent";
import {
  LegalCallout,
  LegalLayout,
  LegalSection,
  LegalToc,
} from "@/components/site/info/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service | PatentSale",
  description:
    "The terms that govern your use of the PatentSale marketplace for unused granted patents.",
};

const LAST_UPDATED = "10 November 2025";

const TOC = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "service", label: "Description of the Service" },
  { id: "eligibility", label: "Eligibility" },
  { id: "sellers", label: "Seller Responsibilities" },
  { id: "buyers", label: "Buyer Responsibilities" },
  { id: "role", label: "PatentSale's Role" },
  { id: "ip", label: "Intellectual Property" },
  { id: "prohibited", label: "Prohibited Conduct" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "termination", label: "Termination & Account Access" },
  { id: "governing-law", label: "Governing Law & Dispute Resolution" },
  { id: "changes", label: "Changes to These Terms" },
  { id: "contact", label: "Contact & Grievance Officer" },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      badge="Legal"
      lastUpdated={LAST_UPDATED}
      intro="These Terms govern your use of the PatentSale marketplace. By accessing or using the Service, you agree to be bound by them."
      toc={<LegalToc items={TOC} />}
    >
      <LegalCallout variant="info" title="A note on these Terms">
        PatentSale is a marketplace that connects patent holders with potential
        buyers, licensees, and assignees. We are not a party to any transaction
        between a seller and a buyer. Please read these Terms carefully —
        particularly the sections on Seller Responsibilities, Buyer
        Responsibilities, and Limitation of Liability.
      </LegalCallout>

      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <p>
          By browsing the Service, submitting a lead, submitting a buyer
          inquiry, contacting us, or otherwise using any feature of the Service,
          you acknowledge that you have read, understood, and agreed to be bound
          by these Terms and our{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree to
          these Terms, please do not use the Service.
        </p>
        <p>
          If you are using the Service on behalf of an organisation, you
          represent and warrant that you have the authority to bind that
          organisation to these Terms.
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. Description of the Service">
        <p>
          PatentSale is a marketplace that connects holders of granted patents
          with potential buyers, licensees, and assignees. The Service allows
          sellers to publish listings describing their patents and allows buyers
          to discover and express interest in those listings.
        </p>
        <p>PatentSale facilitates introductions between sellers and buyers. PatentSale does not itself buy, sell, license, assign, or transfer any intellectual property, and is not a party to any transaction between a seller and a buyer.</p>
        <p>
          The Service is currently offered in an assisted-listing phase, in
          which sellers submit a request and our sales team helps prepare and
          publish the listing. A self-serve flow, in which sellers enter patent
          details and the listing goes live after payment, is on the roadmap.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="3. Eligibility">
        <p>
          The Service is intended for users who are 18 years of age or older.
          By using the Service, you represent and warrant that you are at least
          18 years of age.
        </p>
        <p>
          Each form on the Service requires an affirmative age
          self-declaration. We do not knowingly collect personal information
          from minors. If you believe that a minor has provided personal data
          through the Service, please contact our Grievance Officer and we will
          take steps to delete that data.
        </p>
      </LegalSection>

      <LegalSection id="sellers" title="4. Seller Responsibilities">
        <p>
          If you submit a lead or otherwise request that a patent be listed on
          the Service, you represent and warrant that:
        </p>
        <ul>
          <li>
            The information you provide about the patent — including the patent
            number, jurisdiction, grant date, assignee, and field of use — is
            accurate and complete to the best of your knowledge.
          </li>
          <li>
            You are the rightful owner of the patent or are duly authorised by
            the owner to commercialise it (including by sale, licence, or
            assignment).
          </li>
          <li>
            The patent is in force and is not subject to any encumbrance,
            exclusive licence, or pending revocation or invalidation proceeding
            that would prevent the proposed transaction, unless you disclose
            that fact in writing to our team.
          </li>
          <li>
            You will not list a patent that is the subject of ongoing litigation
            in which you are a defendant alleging invalidity or infringement,
            without disclosing that litigation.
          </li>
        </ul>
        <LegalCallout variant="warning" title="Consequences of misrepresentation">
          Misrepresentation of ownership or of the right to commercialise a
          patent may expose you to civil and criminal liability under applicable
          law. PatentSale reserves the right to refuse, suspend, or remove any
          listing at any time if it has reason to believe that submitted
          information is inaccurate or misleading.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="buyers" title="5. Buyer Responsibilities">
        <p>If you submit a buyer inquiry, you represent and warrant that:</p>
        <ul>
          <li>
            Your inquiry is made in good faith and you have a genuine interest
            in evaluating the listed patent for licensing, acquisition, or
            assignment.
          </li>
          <li>
            You will not use listing data — including patent numbers,
            bibliographic information, summaries, or commercial readiness scores
            — to scrape, resell, repackage, or build a competing database.
          </li>
          <li>
            You will not use information obtained through the Service to
            infringe, design around, or challenge the validity of any listed
            patent outside of a good-faith commercial evaluation.
          </li>
          <li>
            You will not contact a seller other than through the introduction
            facilitated by PatentSale for the purpose of circumventing the
            marketplace.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="role" title="6. PatentSale's Role">
        <p>PatentSale acts solely as a facilitator and platform operator. To be clear:</p>
        <ul>
          <li>
            PatentSale is not a party to any licence, sale, or assignment
            agreement between a seller and a buyer, and is not a broker of
            record.
          </li>
          <li>
            PatentSale does not verify title to any listed patent and makes no
            representation as to the validity, enforceability, or commercial
            value of any patent.
          </li>
          <li>
            The commercial readiness score assigned to a listing reflects
            PatentSale's heuristic assessment based on publicly available and
            seller-provided information, and is not a warranty of commercial
            outcome.
          </li>
          <li>
            During the current assisted-listing phase, PatentSale does not charge
            a commission on transactions facilitated through the Service.
            Listing fees and payment features are planned for a later phase and
            will be governed by a separate schedule and by our{" "}
            <Link href="/refund">Refund / Cancellation Policy</Link>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="ip" title="7. Intellectual Property">
        <p>
          <strong>Service content.</strong> The PatentSale name, logo, site
          design, original text, illustrations, software, and the commercial
          readiness scoring methodology are the intellectual property of
          PatentSale and are protected by applicable laws. You may not copy,
          modify, distribute, or create derivative works of Service content
          without our prior written consent.
        </p>
        <p>
          <strong>Listed patent IP.</strong> The patents described in listings —
          including the underlying inventions, claims, and bibliographic data —
          remain the intellectual property of their respective owners. A listing
          on PatentSale does not transfer any intellectual property rights to
          PatentSale or to viewers of the listing.
        </p>
        <p>
          <strong>Government data.</strong> Patent bibliographic data sourced
          from public patent office databases is used under the terms applicable
          to such data and remains attributable to the issuing authority.
        </p>
      </LegalSection>

      <LegalSection id="prohibited" title="8. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul>
          <li>
            Submit false, misleading, or fraudulent information in any form on
            the Service.
          </li>
          <li>
            Scrape, index, or otherwise extract listing data or user data by
            automated means for resale or for the purpose of building a
            competing service.
          </li>
          <li>
            Use the Service to infringe the intellectual property rights of any
            person.
          </li>
          <li>
            Impersonate another person or misrepresent your affiliation with a
            person or organisation.
          </li>
          <li>
            Attempt to gain unauthorised access to any part of the Service, its
            systems, or its databases.
          </li>
          <li>
            Use the Service to transmit malware, unsolicited commercial
            communications, or any unlawful content.
          </li>
          <li>
            Circumvent any technical measure designed to limit use of the
            Service.
          </li>
        </ul>
        <p>
          Violation of these rules may result in immediate removal of listings,
          suspension of access, and referral to authorities where appropriate.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="9. Limitation of Liability">
        <p>To the maximum extent permitted by applicable law:</p>
        <ul>
          <li>
            The Service is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis. PatentSale disclaims all warranties, express
            or implied, including warranties of merchantability, fitness for a
            particular purpose, and non-infringement.
          </li>
          <li>
            PatentSale does not warrant that any listing will result in a
            successful transaction, licence, or assignment, or that any
            commercial outcome will be achieved.
          </li>
          <li>
            PatentSale shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for any loss of
            profits, business, goodwill, or data, arising out of or related to
            your use of the Service.
          </li>
          <li>
            PatentSale&apos;s aggregate liability arising out of or related to
            these Terms or the Service shall not exceed the total amount, if
            any, paid by you to PatentSale for the Service in the twelve months
            preceding the event giving rise to the claim.
          </li>
        </ul>
        <p>
          Nothing in these Terms excludes or limits liability that cannot be
          excluded or limited under applicable law, including liability for
          gross negligence or wilful misconduct.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title="10. Indemnification">
        <p>
          You agree to indemnify and hold harmless PatentSale and its officers,
          employees, and agents from any claim, demand, loss, or damages —
          including reasonable legal fees — arising out of:
        </p>
        <ul>
          <li>your breach of these Terms;</li>
          <li>
            your misrepresentation of ownership or of the right to commercialise
            a patent;
          </li>
          <li>your misuse of listing data; or</li>
          <li>
            your violation of any applicable law or the rights of any third
            party.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" title="11. Termination & Account Access">
        <ul>
          <li>
            PatentSale may suspend or terminate your access to the Service, and
            remove any listing, at any time and for any reason, including if we
            believe you have violated these Terms.
          </li>
          <li>
            The assisted-listing phase does not require user accounts; once
            self-serve accounts are introduced, account holders may request
            deletion of their account by contacting our Grievance Officer,
            subject to the retention obligations described in the{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </li>
          <li>
            Upon termination, the licences granted to you under these Terms
            cease immediately.
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        id="governing-law"
        title="12. Governing Law & Dispute Resolution"
      >
        <ul>
          <li>
            These Terms are governed by and construed in accordance with the
            laws of India.
          </li>
          <li>
            The courts at Bengaluru, Karnataka, shall have exclusive
            jurisdiction over any dispute arising out of or relating to these
            Terms or the Service, subject to your right to file a complaint
            where you reside under the Consumer Protection Act, 2019, if
            applicable.
          </li>
          <li>
            Before initiating litigation, the parties shall attempt in good
            faith to resolve the dispute through negotiation. Either party may
            escalate a dispute by written notice to the other.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to These Terms">
        <ul>
          <li>
            PatentSale may revise these Terms from time to time. The
            &quot;Last updated&quot; date at the top of this page indicates when
            the Terms were last revised.
          </li>
          <li>
            Material changes will be communicated by updating this page and,
            where appropriate, by notice on the Service. Continued use of the
            Service after a change takes effect constitutes acceptance of the
            revised Terms.
          </li>
          <li>
            For changes that materially affect existing sellers or buyers (such
            as the introduction of listing fees), PatentSale will provide
            reasonable advance notice.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact & Grievance Officer">
        <p>
          <strong>General questions about these Terms.</strong> Email{" "}
          <a href={`mailto:${COMPANY.salesEmail}`}>{COMPANY.salesEmail}</a>.
        </p>
        <p>
          <strong>Grievances under the DPDPA.</strong> Contact our Grievance
          Officer:
        </p>
        <ul>
          <li>
            <strong>Name:</strong> {GRIEVANCE_OFFICER.name}
          </li>
          <li>
            <strong>Email:</strong>{" "}
            <a href={`mailto:${GRIEVANCE_OFFICER.email}`}>
              {GRIEVANCE_OFFICER.email}
            </a>
          </li>
          <li>
            <strong>Address:</strong> {GRIEVANCE_OFFICER.address}
          </li>
        </ul>
        <LegalCallout variant="info" title="DPDPA compliance">
          PatentSale is the &quot;data fiduciary&quot; under the Digital
          Personal Data Protection Act, 2023. See our{" "}
          <Link href="/privacy">Privacy Policy</Link> for the full notice of
          data collection, your rights as a data principal, and the Grievance
          Officer&apos;s contact details.
        </LegalCallout>
      </LegalSection>
    </LegalLayout>
  );
}
