import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode");

  if (!postcode) {
    return NextResponse.json(
      { error: "Postcode is required" },
      { status: 400 }
    );
  }

  try {
    // EPC Open Data API — requires registration for production use.
    // https://epc.opendatacommunities.org/
    // For now, return a placeholder. In production, use the real API with
    // the Accept header set to application/json and an Authorization token.
    //
    // Example production call:
    // const res = await fetch(
    //   `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${postcode}&size=1`,
    //   {
    //     headers: {
    //       Accept: "application/json",
    //       Authorization: `Basic ${process.env.EPC_API_KEY}`,
    //     },
    //   }
    // );

    return NextResponse.json({
      rating: null,
      message: "EPC lookup requires API registration. Configure EPC_API_KEY to enable.",
    });
  } catch {
    return NextResponse.json({ rating: null });
  }
}
