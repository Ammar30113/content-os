import type { TemplateFields } from "@/lib/content/types";
import type React from "react";
import {
  CANVAS_SIZE,
  compactText,
  displayHeadline,
  safeArray,
  safeText,
} from "@/templates/shared";

const signal = {
  ink: "#08090D",
  surface: "#111219",
  raised: "#171922",
  border: "#2B2E38",
  text: "#F5F4F0",
  textSoft: "#C7C4BD",
  muted: "#8A8D99",
  green: "#73D48A",
  yellow: "#F5C24B",
  red: "#F43F4B",
  blue: "#78A6FF",
};

const SAFE = 104;

export function SignalTemplate({ fields }: { fields: TemplateFields }) {
  const template = fields.signal_template_type || fields.signal_content_type;

  if (template === "signal_protocol" || template === "urge_reset_protocol") {
    return <SignalProtocolTemplate fields={fields} />;
  }

  if (template === "signal_pattern" || template === "pattern_awareness") {
    return <SignalPatternTemplate fields={fields} />;
  }

  if (template === "signal_privacy" || template === "privacy_first") {
    return <SignalPrivacyTemplate fields={fields} />;
  }

  if (template === "signal_state" || template === "slip_review") {
    return <SignalStateTemplate fields={fields} />;
  }

  if (template === "signal_steps" || template === "app_feature_steps") {
    return <SignalProtocolTemplate fields={fields} compact />;
  }

  return <SignalQuoteTemplate fields={fields} />;
}

function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: signal.ink,
        color: signal.text,
        display: "flex",
        fontFamily: "Manrope, Inter, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function SignalChrome({ label, accent }: { label: string; accent: string }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 82,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 20px",
          border: `1px solid ${signal.border}`,
          borderRadius: 999,
          backgroundColor: signal.surface,
          color: signal.textSoft,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 2.6,
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 12,
            backgroundColor: accent,
            display: "flex",
          }}
        />
        <span style={{ display: "flex" }}>{compactText(label, "Signal", 38)}</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: SAFE,
          bottom: 58,
          color: signal.muted,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 0.5,
          display: "flex",
        }}
      >
        signal
      </div>
    </>
  );
}

function SignalQuoteTemplate({ fields }: { fields: TemplateFields }) {
  const accent = getAccent(fields);
  const headline = displayHeadline(
    fields.quote || fields.headline,
    "Move first. Think second.",
    72,
  );
  const subhead = compactText(
    fields.subhead || fields.signal_principle,
    "The cue is information. The next move is structure.",
    118,
  );

  return (
    <Canvas>
      <SignalChrome label="private urge reset" accent={accent} />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 214,
          color: signal.text,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headline.length > 58 ? 74 : headline.length > 34 ? 86 : 104,
          lineHeight: 0.98,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          bottom: 214,
          borderTop: `2px solid ${signal.border}`,
          paddingTop: 28,
          color: signal.textSoft,
          fontSize: 30,
          lineHeight: 1.32,
          fontWeight: 700,
          display: "flex",
        }}
      >
        {subhead}
      </div>
      <FooterAction fields={fields} accent={accent} />
    </Canvas>
  );
}

function SignalProtocolTemplate({
  fields,
  compact = false,
}: {
  fields: TemplateFields;
  compact?: boolean;
}) {
  const accent = getAccent(fields);
  const steps = getSignalSteps(fields).slice(0, 6);
  const headline = displayHeadline(
    fields.headline,
    compact ? "Open Signal before the loop" : "The 10-minute reset",
    62,
  );

  return (
    <Canvas>
      <SignalChrome label={compact ? "app flow" : "sos protocol"} accent={accent} />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 178,
          color: signal.text,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headline.length > 34 ? 76 : 92,
          lineHeight: 0.98,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 366,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {steps.map((step, index) => (
          <div
            key={`${step}-${index}`}
            style={{
              minHeight: 62,
              border: `1px solid ${signal.border}`,
              borderRadius: 18,
              backgroundColor: signal.surface,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 42,
                backgroundColor: accent,
                color: signal.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                flex: 1,
                color: signal.text,
                fontSize: 25,
                lineHeight: 1.16,
                fontWeight: 800,
                display: "flex",
              }}
            >
              {compactText(step, "", 64)}
            </div>
          </div>
        ))}
      </div>
      <FooterAction fields={fields} accent={accent} />
    </Canvas>
  );
}

function SignalPatternTemplate({ fields }: { fields: TemplateFields }) {
  const accent = getAccent(fields);
  const rows = safeArray(fields.info_rows).length
    ? safeArray(fields.info_rows)
    : [
        fields.signal_trigger || "Late-night phone",
        "Restless scrolling",
        "Bargaining starts",
        fields.signal_redirect_action || "Walk without phone",
      ];
  const headline = displayHeadline(fields.headline, "Your pattern has a shape", 58);

  return (
    <Canvas>
      <SignalChrome label="pattern map" accent={accent} />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 178,
          color: signal.text,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headline.length > 34 ? 76 : 92,
          lineHeight: 0.98,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 378,
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${signal.border}`,
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        {rows.slice(0, 5).map((row, index) => (
          <div
            key={`${row}-${index}`}
            style={{
              minHeight: 84,
              padding: "22px 26px",
              backgroundColor: index % 2 === 0 ? signal.surface : signal.raised,
              borderBottom:
                index === rows.length - 1 ? "none" : `1px solid ${signal.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
            }}
          >
            <span
              style={{
                color: signal.text,
                fontSize: 27,
                fontWeight: 800,
                display: "flex",
              }}
            >
              {compactText(row, "", 52)}
            </span>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 14,
                backgroundColor: index < 2 ? signal.yellow : accent,
                display: "flex",
              }}
            />
          </div>
        ))}
      </div>
      <FooterAction fields={fields} accent={accent} />
    </Canvas>
  );
}

function SignalPrivacyTemplate({ fields }: { fields: TemplateFields }) {
  const headline = displayHeadline(fields.headline, "Private means private", 56);
  const rows = [
    "No accounts",
    "No analytics",
    "No screenshots",
    "On-device by default",
  ];

  return (
    <Canvas>
      <SignalChrome label="privacy posture" accent={signal.blue} />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 202,
          color: signal.text,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headline.length > 28 ? 78 : 96,
          lineHeight: 0.98,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 426,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        {rows.map((row) => (
          <div
            key={row}
            style={{
              minHeight: 132,
              border: `1px solid ${signal.border}`,
              borderRadius: 22,
              backgroundColor: signal.surface,
              color: signal.text,
              padding: 24,
              fontSize: 28,
              lineHeight: 1.15,
              fontWeight: 900,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            {row}
          </div>
        ))}
      </div>
      <FooterAction fields={fields} accent={signal.blue} />
    </Canvas>
  );
}

function SignalStateTemplate({ fields }: { fields: TemplateFields }) {
  const accent = getAccent(fields);
  const state = safeText(fields.signal_state, "red").toUpperCase();
  const headline = displayHeadline(fields.headline, "No shame spiral", 60);
  const subhead = compactText(
    fields.subhead,
    "Review the sequence. Find the earlier signal. Reset the next move.",
    112,
  );

  return (
    <Canvas>
      <SignalChrome label="slip review" accent={accent} />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: 196,
          width: 148,
          height: 148,
          borderRadius: 148,
          backgroundColor: accent,
          color: signal.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: 2.4,
        }}
      >
        {state}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 402,
          color: signal.text,
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: headline.length > 30 ? 82 : 100,
          lineHeight: 0.98,
          fontWeight: 900,
          display: "flex",
        }}
      >
        {headline}
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          bottom: 216,
          color: signal.textSoft,
          fontSize: 31,
          lineHeight: 1.32,
          fontWeight: 700,
          display: "flex",
        }}
      >
        {subhead}
      </div>
      <FooterAction fields={fields} accent={accent} />
    </Canvas>
  );
}

function FooterAction({ fields, accent }: { fields: TemplateFields; accent: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE,
        right: SAFE,
        bottom: 94,
        borderTop: `2px solid ${signal.border}`,
        paddingTop: 28,
        display: "flex",
        justifyContent: "space-between",
        gap: 24,
        color: signal.muted,
        fontSize: 25,
        fontWeight: 800,
      }}
    >
      <span style={{ display: "flex" }}>private reset</span>
      <span style={{ display: "flex", color: accent }}>
        {compactText(fields.door_label, "Open Signal", 28)}
      </span>
    </div>
  );
}

function getSignalSteps(fields: TemplateFields) {
  const steps = safeArray(fields.signal_protocol_steps);

  if (steps.length) {
    return steps;
  }

  return [
    "Name the cue",
    "Change the room",
    "Move for two minutes",
    "Choose one redirect",
    "Let the timer finish",
    "Record the signal",
  ];
}

function getAccent(fields: TemplateFields) {
  if (fields.signal_state === "red") {
    return signal.red;
  }

  if (fields.signal_state === "yellow") {
    return signal.yellow;
  }

  return signal.green;
}
