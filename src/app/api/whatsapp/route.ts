import { NextResponse } from "next/server";
import { getQRCode, getConnectionStatus } from "@/lib/whatsapp";

export async function GET() {
  const qr = getQRCode();
  const connected = getConnectionStatus();

  return NextResponse.json({ connected, qr });
}
