import { NextResponse } from "next/server";
import { AppError } from "./errors/AppError";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data, error: null, meta: null },
    { status }
  );
}

export function createdResponse<T>(data: T) {
  return successResponse(data, 201);
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

export function paginatedResponse<T>(
  data: T[],
  meta: { page: number; limit: number; total: number; [key: string]: unknown }
) {
  return NextResponse.json(
    { success: true, data, error: null, meta },
    { status: 200 }
  );
}

export function errorResponse(error: AppError) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields && { fields: error.fields }),
      },
      meta: null,
    },
    { status: error.statusCode }
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error);
  }
  console.error("Unexpected error:", error);
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code: "INTERNAL", message },
      meta: null,
    },
    { status: 500 }
  );
}
