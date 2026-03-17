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
    // Using postcodes.io (free, no API key required)
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) {
      return NextResponse.json({ addresses: [] });
    }

    const data = await res.json();

    if (data.status !== 200 || !data.result) {
      return NextResponse.json({ addresses: [] });
    }

    const result = data.result;

    // postcodes.io returns area data, not individual addresses.
    // For a production app, use Ideal Postcodes or GetAddress.io.
    // For now, return the area info so the user can fill in house number.
    return NextResponse.json({
      addresses: [],
      area: {
        post_town: result.admin_ward || "",
        county: result.admin_county || "",
        region: result.region || "",
        country: result.country || "",
        parish: result.parish || "",
        local_authority: result.admin_district || "",
      },
      postcode: result.postcode,
    });
  } catch {
    return NextResponse.json({ addresses: [] });
  }
}
