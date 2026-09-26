import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // The portal's Pay Now / Approve pages must not be embeddable in
          // another site (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Uploaded documents are served with the uploader's content type —
          // never let browsers sniff their way around it.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
