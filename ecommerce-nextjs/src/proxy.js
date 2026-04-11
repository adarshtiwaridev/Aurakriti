import { NextResponse } from "next/server";

export function proxy(request) {
  return NextResponse.next();
}