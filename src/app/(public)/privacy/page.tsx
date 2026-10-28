import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, GRIEVANCE_OFFICER } from "@/lib/consent";
import {
  LegalCallout,
  LegalLayout,
  LegalSection,
  LegalToc,
} from "@/components/site/info/legal-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Privacy Policy | PatentSale",
  description:
    "How PatentSale collects, uses, and protects personal data under the Digital Personal Data Protection Act, 2023 (DPDPA).",
};

const LAST_UPDATED = "10 November 2025";

const TOC = [
  { id: "fiduciary", label: "Data Fiduciary Notice" },
  { id: "data", label: "Personal Data We Collect" },
  { id: "purpose", label: "Purpose Limitation" },
  { id: "consent", label: "Legal Basis & Consent" },
  { id: "rights", label: "Your Rights as a Data Principal" },
  { id: "grievance", label: "Grievance Officer" },
  { id: "retention", label: "Data Retention" },
  { id: "sharing", label: "Data Sharing & Recipients" },
  { id: "transfer", label: "Cross-Border Transfer" },
  { id: "children", label: "Children's Data" },
  { id: "security", label: "Security" },
  { id: "analytics", label: "Analytics Disclosure" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact" },
];

const TOUCHPOINTS = [
  {
    touchpoint: "Lead capture form (Request a callback)",
    data: "Name, email, phone number, patent number",
    purpose: "Enable our sales team to contact you about listing your patent on the marketplace.",
  },
  {
    touchpoint: "Buyer inquiry form",
    data: "Name, email, phone number, message, budget range, intended use",
    purpose: "Facilitate an introduction regarding a specific listed patent.",
  },
  {
    touchpoint: "Contact Us form",
    data: "Name, email, subject, message",
    purpose: "Respond to your general inquiry.",
  },
  {
    touchpoint: "Self-serve listing flow (forthcoming)",
    data: "Seller contact details, organisation details, patent details, supporting documents",
    purpose: "Publish a listing on the marketplace.",
  },
  {
    touchpoint: "Analytics",
    data: "Anonymous session identifier, page path, referrer, anonymised IP address, user agent, event type",
    purpose: "Understand how the Service is used and improve the marketplace.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      badge="Legal · DPDPA"
      lastUpdated={LAST_UPDATED}
      intro="This Privacy Policy explains how PatentSale collects, uses, discloses, and protects your personal data under the Digital Personal Data Protection Act, 2023 (DPDPA). PatentSale is the data fiduciary for the personal data collected through the Service."
      toc={<LegalToc items={TOC} />}
    >
      <LegalCallout variant="info" title="PatentSale is the data fiduciary">
        Under the DPDPA, PatentSale is the &quot;data fiduciary&quot; — the
        entity that determines the purposes and means of processing your
        personal data. As data fiduciary, we are responsible for giving you
        notice of the data we collect, honouring your rights as a data
        principal, and nominating a Grievance Officer.
      </LegalCallout>

      <LegalSection id="fiduciary" title="1. Data Fiduciary Notice">
        <p>
          PatentSale is the data fiduciary for the personal data collected
          through the Service at{" "}
          <a href={`https://${COMPANY.domain}`}>{COMPANY.domain}</a>. The data
          principal is the individual to whom the personal data relates — that
          is, you.
        </p>
        <p>
          This Policy is published in accordance with the DPDPA and applies to
          all personal data collected through the Service, regardless of whether
          you submit a lead, an inquiry, a contact message, or simply browse the
          marketplace.
        </p>
      </LegalSection>

      <LegalSection id="data" title="2. Personal Data We Collect and Why">
        <p>
          We collect personal data only at defined touchpoints, and only for the
          purposes stated at the point of collection. The table below itemises
          each touchpoint, the data fields collected, and the purpose of
          processing.
        </p>
        <div className="my-4 overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide">
                  Touchpoint
                </TableHead>
                <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide">
                  Data Collected
                </TableHead>
                <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide">
                  Purpose
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOUCHPOINTS.map((row) => (
                <TableRow key={row.touchpoint}>
                  <TableCell className="px-3 py-3 align-top text-xs font-medium text-foreground">
                    {row.touchpoint}
                  </TableCell>
                  <TableCell className="px-3 py-3 align-top text-xs">
                    {row.data}
                  </TableCell>
                  <TableCell className="px-3 py-3 align-top text-xs">
                    {row.purpose}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <LegalCallout variant="info" title="Analytics — what we do not store">
          We do <strong>not</strong> store raw full IP addresses. The IP
          address is anonymised at the point of collection by dropping the last
          octet (for IPv4) or its equivalent prefix (for IPv6). Analytics data
          is <strong>not</strong> linked to your email address, phone number, or
          any other personal identifier submitted through the forms above.
        </LegalCallout>
      </LegalSection>

      <LegalSection id="purpose" title="3. Purpose Limitation">
        <p>
          We process your personal data only for the purposes stated at the
          point of collection. We do not use lead, inquiry, or contact data for
          any unrelated purpose, and we do not sell your personal data to any
          third party.
        </p>
        <p>
          If we wish to process your personal data for a new purpose that is
          incompatible with the original purpose, we will seek your fresh
          consent before doing so.
        </p>
      </LegalSection>

      <LegalSection id="consent" title="4. Legal Basis and Consent">
        <p>
          Our processing of your personal data is based on your{" "}
          <strong>explicit consent</strong>. Consent is collected through a
          dedicated, itemised checkbox at each form on the Service, and is{" "}
          <strong>not implied by the act of submitting the form</strong>. You
          must affirmatively tick the consent checkbox (and confirm that you are
          18 years of age or older) before your submission is accepted.
        </p>
        <p>
          A snapshot of the exact consent language you agreed to is stored
          alongside your record at the time of submission, so the consent you
          gave is preserved even if the consent language is later revised.
        </p>
        <p>
          You may withdraw consent at any time. Withdrawal does not affect the
          lawfulness of processing carried out before withdrawal. To withdraw
          consent, contact the Grievance Officer using the details in Section 6.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="5. Your Rights as a Data Principal">
        <p>
          Under the DPDPA, you have the following rights with respect to your
          personal data. To exercise any of these rights, contact the Grievance
          Officer using the details in Section 6.
        </p>
        <ul>
          <li>
            <strong>Access.</strong> You may request a summary of the personal
            data we hold about you and the processing activities carried out on
            it.
          </li>
          <li>
            <strong>Correction.</strong> You may request correction of
            inaccurate or misleading personal data, or completion of incomplete
            personal data.
          </li>
          <li>
            <strong>Erasure.</strong> You may request erasure of your personal
            data, subject to the retention rules described in Section 7. Erasure
            applies to the personal contact details attached to leads,
            inquiries, and contact messages. Published patent listing data is
            intentionally public and commercial in nature and is not subject to
            erasure.
          </li>
          <li>
            <strong>Grievance redressal.</strong> You may lodge a complaint with
            the Grievance Officer if you have a concern about how your personal
            data has been processed.
          </li>
          <li>
            <strong>Consent withdrawal.</strong> You may withdraw the consent
            you gave at any form on the Service. Withdrawal will stop further
            processing for that purpose; data already lawfully processed before
            withdrawal may be retained as described in Section 7.
          </li>
        </ul>
        <p>
          We will respond to verifiable requests within the timeframe prescribed
          under the DPDPA.
        </p>
      </LegalSection>

      <LegalSection id="grievance" title="6. Grievance Officer">
        <p>
          PatentSale has appointed a Grievance Officer to address concerns
          regarding the processing of your personal data and to handle requests
          to exercise your data principal rights.
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
        <p>
          Grievances will be acknowledged within the timeframe prescribed under
          the DPDPA, and we will use reasonable efforts to resolve each
          grievance within the statutory timeframe from the date of receipt.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="7. Data Retention">
        <p>
          We retain personal data only as long as necessary for the purposes
          stated at the point of collection:
        </p>
        <ul>
          <li>
            <strong>Lead and buyer inquiry PII:</strong> Retained for the
            duration of active engagement with you, plus a defined period of{" "}
            <strong>24 months</strong> from the date of your last interaction,
            after which it is deleted or anonymised unless a legal obligation
            (such as an unresolved dispute or legal hold) requires longer
            retention.
          </li>
          <li>
            <strong>Contact Us messages:</strong> Retained for{" "}
            <strong>12 months</strong> from the date of receipt, after which
            they are deleted.
          </li>
          <li>
            <strong>Consent records:</strong> Retained for the duration of the
            underlying data retention period plus <strong>36 months</strong>, to
            demonstrate that valid consent was obtained.
          </li>
          <li>
            <strong>Published patent listing data:</strong> Intentionally public
            and commercial in nature; retained for the lifetime of the listing
            and <strong>not subject to erasure</strong>. Erasure applies to the
            personal contact details attached to leads and inquiries, not to the
            commercial listing data.
          </li>
          <li>
            <strong>Analytics data:</strong> Anonymised and retained in
            aggregate form for up to <strong>24 months</strong>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="sharing" title="8. Data Sharing and Recipients">
        <p>
          We share personal data only with the categories of recipients
          necessary to operate the Service:
        </p>
        <ul>
          <li>
            <strong>Internal sales team.</strong> To contact leads and
            facilitate introductions.
          </li>
          <li>
            <strong>Transactional email provider.</strong> To deliver
            acknowledgement and notification emails in response to your
            submission.
          </li>
          <li>
            <strong>Cloud database provider (Neon).</strong> To store lead,
            inquiry, and contact records securely.
          </li>
          <li>
            <strong>Object storage provider (Cloudflare R2).</strong> To store
            supporting documents submitted in connection with a listing.
          </li>
          <li>
            <strong>Payment provider (Razorpay).</strong> Once payment features
            go live, to process listing fee payments. Razorpay will receive
            only the data necessary to process the transaction.
          </li>
        </ul>
        <p>
          PatentSale remains the data fiduciary and remains liable for the
          processing of your personal data by each of the above recipients. We
          do not sell your personal data, and we do not share it with any other
          third party without your consent except where required by law.
        </p>
      </LegalSection>

      <LegalSection id="transfer" title="9. Cross-Border Transfer">
        <p>
          Some of the recipients listed in Section 8 process data outside India
          (for example, our cloud database and object storage providers). The
          DPDPA permits transfer of personal data outside India except to
          countries or territories that the Central Government may notify as
          restricted.
        </p>
        <p>
          Our use of cross-border processors is a deliberate operational choice,
          and we will not transfer personal data to any country or territory
          notified as restricted under the DPDPA.
        </p>
      </LegalSection>

      <LegalSection id="children" title="10. Children's Data">
        <p>
          The Service is intended for users who are 18 years of age or older.
          Each form on the Service requires an affirmative age self-declaration.
          We do not knowingly collect personal data from minors.
        </p>
        <p>
          If you believe that a minor has provided personal data through the
          Service, please contact our Grievance Officer and we will take steps
          to delete that data.
        </p>
      </LegalSection>

      <LegalSection id="security" title="11. Security">
        <p>
          We implement reasonable organisational and technical measures to
          protect your personal data, including:
        </p>
        <ul>
          <li>
            TLS encryption for data in transit between your browser and our
            servers.
          </li>
          <li>
            bcrypt password hashing for administrator credentials.
          </li>
          <li>
            Multi-factor authentication (TOTP-based) for all administrative
            access.
          </li>
          <li>
            Role-based access controls limiting access to personal data to
            authorised personnel on a need-to-know basis.
          </li>
          <li>Audit logging of access to administrative systems.</li>
        </ul>
        <p>
          No system can be perfectly secure. In the event of a personal data
          breach affecting you, we will notify you and the Data Protection Board
          of India in accordance with the DPDPA.
        </p>
      </LegalSection>

      <LegalSection id="analytics" title="12. Analytics Disclosure">
        <p>
          The Service uses a self-hosted analytics system to understand how it
          is used. The following is collected on each page view and on tracked
          interaction events:
        </p>
        <ul>
          <li>
            An <strong>anonymous session identifier</strong> (randomly
            generated; not linked to your email or phone).
          </li>
          <li>
            The <strong>page path</strong> and <strong>referrer URL</strong>.
          </li>
          <li>
            An <strong>anonymised IP address</strong> (last octet dropped for
            IPv4; equivalent prefix dropped for IPv6).
          </li>
          <li>
            The <strong>user agent</strong> string (browser and operating
            system family).
          </li>
          <li>
            The <strong>event type</strong> (for example, <code>page_view</code>
            ).
          </li>
        </ul>
        <p>
          We do not store raw full IP addresses, and analytics events are not
          correlated with the personal identifiers you submit through the lead,
          inquiry, or contact forms.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last
          updated&quot; date at the top of this page indicates when the Policy
          was last revised. Material changes will be communicated by updating
          this page and, where appropriate, by notice on the Service. We
          encourage you to review this page periodically.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <p>
          For any questions about this Privacy Policy or your personal data,
          contact:
        </p>
        <ul>
          <li>
            <strong>General questions:</strong>{" "}
            <a href={`mailto:${COMPANY.salesEmail}`}>{COMPANY.salesEmail}</a>
          </li>
          <li>
            <strong>Grievance Officer:</strong>{" "}
            <a href={`mailto:${GRIEVANCE_OFFICER.email}`}>
              {GRIEVANCE_OFFICER.email}
            </a>{" "}
            (see Section 6 for the full address)
          </li>
        </ul>
        <LegalCallout variant="info" title="Related documents">
          See also our <Link href="/terms">Terms of Service</Link> and our{" "}
          <Link href="/refund">Refund / Cancellation Policy</Link>.
        </LegalCallout>
      </LegalSection>
    </LegalLayout>
  );
}
