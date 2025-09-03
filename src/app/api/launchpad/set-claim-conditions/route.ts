import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: false,
    error: "Desativado. Configure as Claim Conditions diretamente no Dashboard da Thirdweb."
  }, { status: 400 });
}