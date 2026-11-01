import { type NextRequest, NextResponse } from "next/server"

/**
 * Dynamic vCard Generator Route
 * Generates a vCard (business card) file with bank, email, and phone information
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bank = searchParams.get("bank") || "Ecobank"
    const email = searchParams.get("email") || ""
    const phone = searchParams.get("phone") || ""

    // Generate vCard format (RFC 6350)
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${bank}
TITLE:Banking Partner
EMAIL:${email}
TEL:${phone}
ORG:${bank}
NOTE:Business card shared via Ecobank Mobile App
END:VCARD`

    // Return as vCard file with proper MIME type
    return new NextResponse(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${bank.replace(/\s+/g, "_")}_businesscard.vcf"`,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("vCard generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate vCard" },
      { status: 500 }
    )
  }
}
