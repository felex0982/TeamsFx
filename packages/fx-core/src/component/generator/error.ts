// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BaseComponentInnerError } from "../error/componentError";
import { errorSource } from "./constant";
import axios, { AxiosError } from "axios";

export class CancelDownloading extends Error {}

export class SampleNotFoundError extends BaseComponentInnerError {
  constructor(templateName: string) {
    super(
      errorSource,
      "SystemError",
      "SampleNotFoundError",
      "error.generator.SampleNotFoundError",
      [templateName]
    );
  }
}

export class TemplateNotFoundError extends BaseComponentInnerError {
  constructor(templateName: string) {
    super(
      errorSource,
      "SystemError",
      "TemplateNotFoundError",
      "error.generator.TemplateNotFoundError",
      [templateName]
    );
  }
}

export class TemplateZipFallbackError extends BaseComponentInnerError {
  constructor() {
    super(
      errorSource,
      "SystemError",
      "TemplateZipFallbackError",
      "error.generator.TemplateZipFallbackError"
    );
  }
}

export class UnzipError extends BaseComponentInnerError {
  constructor() {
    super(errorSource, "SystemError", "UnzipError", "error.generator.UnzipError", undefined, [
      "plugins.frontend.checkFsPermissionsTip",
    ]);
  }
}

export function simplifyAxiosError(error: AxiosError): Error {
  const simplifiedError = {
    message: error.message,
    name: error.name,
    config: error.config,
    code: error.code,
    stack: error.stack,
    status: error.response?.status,
    statusText: error.response?.statusText,
    headers: error.response?.headers,
    data: error.response?.data,
  };
  return simplifiedError;
}

export class DownloadSampleNetworkError extends BaseComponentInnerError {
  constructor(url: string, error: Error) {
    const innerError = axios.isAxiosError(error) ? simplifyAxiosError(error) : error;
    super(
      errorSource,
      "UserError",
      "DownloadSampleNetworkError",
      "error.generator.DownloadSampleNetworkError",
      [url],
      undefined,
      undefined,
      undefined,
      innerError
    );
  }
}

export class DownloadSampleApiLimitError extends BaseComponentInnerError {
  constructor(url: string, error: Error) {
    const innerError = axios.isAxiosError(error) ? simplifyAxiosError(error) : error;
    super(
      errorSource,
      "UserError",
      "DownloadSampleApiLimitError",
      "error.generator.DownloadSampleApiLimitError",
      [url],
      undefined,
      undefined,
      undefined,
      innerError
    );
  }
}

export function isApiLimitError(error: Error): boolean {
  //https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api?apiVersion=2022-11-28#exceeding-the-rate-limit
  return (
    axios.isAxiosError(error) &&
    error.response?.status !== undefined &&
    [403, 429].includes(error.response.status) &&
    error.response?.headers?.["x-ratelimit-remaining"] === "0"
  );
}

export class ParseUrlError extends BaseComponentInnerError {
  constructor(url: string) {
    super(errorSource, "SystemError", "ParseUrlError", "error.generator.ParseUrlError", [url]);
  }
}

export class FetchZipFromUrlError extends BaseComponentInnerError {
  constructor(url: string, error?: Error) {
    super(
      errorSource,
      "SystemError",
      "FetchZipFromUrlError",
      "error.generator.FetchZipFromUrlError",
      [url],
      ["plugins.frontend.checkNetworkTip"],
      undefined,
      undefined,
      error
    );
  }
}

export class MissKeyError extends BaseComponentInnerError {
  constructor(keyName: string) {
    super(errorSource, "SystemError", "MissKeyError", "error.generator.MissKeyError", [keyName]);
  }
}
