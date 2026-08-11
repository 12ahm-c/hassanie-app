import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      timestamp,
      services: {
        database: "connected",
        huggingface: process.env.HUGGINGFACE_TOKEN ? "configured" : "not configured",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp,
        services: {
          database: "disconnected",
          huggingface: process.env.HUGGINGFACE_TOKEN ? "configured" : "not configured",
        },
      },
      { status: 503 }
    );
  }
}
