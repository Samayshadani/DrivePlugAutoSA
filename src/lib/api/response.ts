import { NextResponse } from 'next/server';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function apiSuccess<T>(data: T, status = 200, meta?: ApiResponse<T>['meta']) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(payload, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: any
) {
  const payload: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(payload, { status });
}
