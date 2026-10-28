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
  title: "Refund & Cancellation Policy | PatentSale",
  description:
    "PatentSale's refund and cancellation policy for paid listing fees and paid services.",
};

const LAST_UPDATED = "10 November 2025";

const TOC = [
  { id: "scope", label: "Scope" },
  { id: "eligibility", label: "Refund Eligibility" },
  { id: "non-refundable", label: "Non-Refundable Scenarios" },
  { id: "cancellation", label: "Cancellation" },
  { id: "processing", label: "Processing Time" },
  { id: "contact", label: "Contact" },
  { id: "changes", label: "Changes to This Policy" },
];

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      badge="Legal"
      lastUpdated={LAST_UPDATED}
      intro="This Policy applies to paid listing fees and paid services on the PatentSale marketplace once payment features are enabled. The current assisted-listing flow does not require any upfront payment."
      toc={<LegalToc items={TOC} />}
    >
      <LegalCallout variant="info" title="Current phase — no payment required">
        PatentSale is currently in an assisted-listing phase. The sales team
        helps you prepare and publish a listing, and <strong>no upfront payment
        is collected</strong>. This Policy will apply only when a payment is
        collected from you — for example, once the self-serve listing flow and
        payment features go live.
      </LegalCallout>

      <LegalSection id="scope" title="1. Scope">
        <p>This Policy applies to:</p>
        <ul>
          <li>
            <strong>Listing fees</strong> charged for publishing a patent on the
            marketplace once the self-serve listing flow and payment features go
            live.
          </li>
          <li>
            <strong>Future paid services</strong> offered by PatentSale (such as
            featured placement or premium listing enhancements), as described on
            the Service at the time of purchase.
          </li>
        </ul>
        <p>
          It does <strong>not</strong> apply to the assisted-listing flow in its
          current form, which does not involve any payment.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Refund Eligibility">
        <ul>
          <li>
            <strong>If your listing has not yet been published:</strong> You may
            request a <strong>full refund within 7 calendar days</strong> of the
            date of payment. The refund will be processed to the original
            payment method.
          </li>
          <li>
            <strong>If your listing has already been published:</strong> Refunds
            are at PatentSale&apos;s discretion. We may, at our option, offer a{" "}
            <strong>pro-rated refund</strong> based on the time remaining in the
            listing period, or decline the refund where the service has been
            substantially delivered.
          </li>
          <li>
            <strong>Statutory rights:</strong> Nothing in this Policy limits any
            statutory consumer rights you may have under applicable Indian law,
            including the Consumer Protection Act, 2019.
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        id="non-refundable"
        title="3. Non-Refundable Scenarios"
      >
        <p>The following are non-refundable:</p>
        <ul>
          <li>
            Listings that have been published and remain live on the
            marketplace.
          </li>
          <li>
            Facilitation services that have been substantially performed — for
            example, where our sales team has prepared and submitted the listing
            on your behalf and the listing has gone live.
          </li>
          <li>
            Purchases where you have violated the{" "}
            <Link href="/terms">Terms of Service</Link>, including by submitting
            false or misleading information or by misrepresenting ownership of a
            patent.
          </li>
          <li>
            Featured placement or premium enhancements that have already been
            activated.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cancellation" title="4. Cancellation">
        <ul>
          <li>
            <strong>Pending listings.</strong> To cancel a listing that has not
            yet been published, email{" "}
            <a href={`mailto:${COMPANY.salesEmail}`}>{COMPANY.salesEmail}</a>{" "}
            with the subject &quot;Cancellation Request&quot; and include your
            name, the patent number, and the date of payment. We will process
            the cancellation and, where a payment has been collected and the
            listing has not been published, refund the amount in accordance with
            Section 2.
          </li>
          <li>
            <strong>Live listings.</strong> To remove a live listing from the
            marketplace, contact us at{" "}
            <a href={`mailto:${COMPANY.salesEmail}`}>{COMPANY.salesEmail}</a>.
            Removal of a live listing does not automatically entitle you to a
            refund; see Section 2.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="processing" title="5. Processing Time">
        <p>
          Approved refunds will be processed within{" "}
          <strong>7–10 business days</strong> from the date of approval to the
          original payment method. The time taken for the refund to appear in
          your account may vary depending on your payment provider and bank.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="6. Contact">
        <p>For refund or cancellation requests:</p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href={`mailto:${COMPANY.salesEmail}`}>{COMPANY.salesEmail}</a>
          </li>
          <li>
            <strong>Grievance Officer (escalations):</strong>{" "}
            <a href={`mailto:${GRIEVANCE_OFFICER.email}`}>
              {GRIEVANCE_OFFICER.email}
            </a>{" "}
            — {GRIEVANCE_OFFICER.name}, {GRIEVANCE_OFFICER.address}. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for the full address and
            grievance handling timelines.
          </li>
        </ul>
        <LegalCallout
          variant="warning"
          title="Listing fees, not transaction commissions"
        >
          PatentSale does <strong>not</strong> charge any commission on
          transactions facilitated between a seller and a buyer during the
          assisted-listing phase. The fees covered by this Policy are{" "}
          <strong>listing fees</strong> charged by PatentSale to the seller, not
          transaction commissions.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes to This Policy">
        <p>
          We may update this Policy from time to time. The &quot;Last
          updated&quot; date at the top of this page indicates when the Policy
          was last revised. Material changes will be communicated by updating
          this page and, where appropriate, by notice on the Service.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
