"use client";
// Shared DPDPA consent notice — reused across lead capture, buyer inquiry,
// and (Prompt 3) self-serve flow. Reuse this rather than reimplementing consent.
//
// Itemized notice of what's collected + why, explicit consent checkbox (NOT
// implied by submission), age self-declaration (18+), and a Privacy Policy link.
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface ConsentState {
  consent: boolean;
  ageConfirmed: boolean;
}

export function ConsentNotice({
  consentText,
  ageText,
  value,
  onChange,
  idPrefix = "consent",
  error,
}: {
  consentText: string;
  ageText: string;
  value: ConsentState;
  onChange: (v: ConsentState) => void;
  idPrefix?: string;
  error?: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
      <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">What we collect & why</p>
        <p>{consentText}</p>
        <p>
          Read our full{" "}
          <Link href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id={`${idPrefix}-age`}
            checked={value.ageConfirmed}
            onCheckedChange={(c) => onChange({ ...value, ageConfirmed: c === true })}
            className="mt-0.5"
          />
          <Label htmlFor={`${idPrefix}-age`} className="text-xs font-normal leading-relaxed cursor-pointer">
            {ageText}
          </Label>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id={`${idPrefix}-agree`}
            checked={value.consent}
            onCheckedChange={(c) => onChange({ ...value, consent: c === true })}
            className="mt-0.5"
          />
          <Label htmlFor={`${idPrefix}-agree`} className="text-xs font-normal leading-relaxed cursor-pointer">
            I have read the notice above and consent to the collection and use of my data as described.
          </Label>
        </div>
      </div>

      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
