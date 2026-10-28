// PatentSale — DPDPA consent language, defined ONCE and reused across the three
// consent touchpoints: lead capture form, buyer inquiry form, and (Prompt 3)
// the self-serve flow form. Reuse the shared <ConsentNotice /> component rather
// than reimplementing consent at each touchpoint.
//
// These strings are snapshot-stored on each Lead / BuyerInquiry record at
// submission time, so the exact consent language a user agreed to is preserved
// even if this constant is later edited.

export const LEAD_CONSENT_TEXT = `I consent to PatentSale collecting my name, email, phone number, and patent number for the purpose of enabling our sales team to contact me about listing my patent on the marketplace. I have read and agree to the Privacy Policy. I understand I may withdraw consent or request access, correction, or erasure of my data at any time via the Grievance Officer listed in the Privacy Policy.`;

export const BUYER_CONSENT_TEXT = `I consent to PatentSale collecting my name, email, phone number, and details of my interest for the purpose of enabling our sales team to facilitate an introduction regarding this patent. I have read and agree to the Privacy Policy. I understand I may withdraw consent or request access, correction, or erasure of my data at any time via the Grievance Officer listed in the Privacy Policy.`;

export const REPORT_CONSENT_TEXT = `I consent to PatentSale collecting my name, email, phone, company, and role for the purpose of sending me the full commercial readiness report for this patent and enabling our sales team to follow up. I have read and agree to the Privacy Policy. I understand I may withdraw consent or request access, correction, or erasure of my data at any time via the Grievance Officer listed in the Privacy Policy.`;

export const AGE_DECLARATION_TEXT = `I confirm I am 18 years of age or older.`;

// DPDPA Grievance Officer — must be a named contact distinct from general Contact Us.
export const GRIEVANCE_OFFICER = {
  name: "Grievance Officer, PatentSale",
  email: "grievance@patentforsale.in",
  address: "PatentSale, [Registered Office Address], India",
};

export const COMPANY = {
  name: "PatentSale",
  domain: "patentforsale.in",
  salesEmail: "info@patentforsale.in",
  grievanceEmail: "grievance@patentforsale.in",
};
