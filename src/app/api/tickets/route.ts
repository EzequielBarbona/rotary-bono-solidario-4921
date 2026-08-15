import { NextResponse } from "next/server";
import { getTicketGrid } from "@/lib/tickets";

export async function GET() {
  const tickets = await getTicketGrid();
  return NextResponse.json({ tickets });
}
