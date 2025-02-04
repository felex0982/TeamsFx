// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import AdmZip from "adm-zip";
import fs from "fs-extra";
import path from "path";

import { LogProvider } from "@microsoft/teamsfx-api";

import { FeatureFlagName } from "../../common/constants";
import { getTemplatesFolder } from "../../folder";
import { MissKeyError } from "./error";
import {
  downloadDirectory,
  fetchTemplateZipUrl,
  fetchZipFromUrl,
  SampleUrlInfo,
  unzip,
  zipFolder,
} from "./utils";

export interface GeneratorContext {
  name: string;
  destination: string;
  logProvider: LogProvider;
  tryLimits?: number;
  timeoutInMs?: number;
  url?: string;
  sampleInfo?: SampleUrlInfo;
  zip?: AdmZip;
  fallback?: boolean;
  cancelDownloading?: boolean;
  outputs?: string[];

  filterFn?: (name: string) => boolean;
  fileNameReplaceFn?: (name: string, data: Buffer) => string;
  fileDataReplaceFn?: (name: string, data: Buffer) => Buffer | string;

  onActionStart?: (action: GeneratorAction, context: GeneratorContext) => Promise<void>;
  onActionEnd?: (action: GeneratorAction, context: GeneratorContext) => Promise<void>;
  onActionError?: (
    action: GeneratorAction,
    context: GeneratorContext,
    error: Error
  ) => Promise<void>;
}

export interface GeneratorAction {
  name: string;
  run: (context: GeneratorContext) => Promise<void>;
}

export enum GeneratorActionName {
  FetchTemplateZipFromSourceCode = "FetchTemplateZipFromSourceCodeAction",
  FetchTemplateUrlWithTag = "FetchTemplatesUrlWithTag",
  FetchZipFromUrl = "FetchZipFromUrl",
  FetchTemplateZipFromLocal = "FetchTemplateZipFromLocal",
  DownloadDirectory = "DownloadDirectory",
  Unzip = "Unzip",
}

// * This action is only for debug purpose
export const fetchTemplateZipFromSourceCodeAction: GeneratorAction = {
  name: GeneratorActionName.FetchTemplateZipFromSourceCode,
  run: (context: GeneratorContext) => {
    const isDebugMode = () => {
      const DebugTemplateFlag = process.env[FeatureFlagName.DebugTemplate];
      return DebugTemplateFlag?.toLowerCase() === "true" && process.env.NODE_ENV === "development";
    };

    if (!isDebugMode()) {
      return Promise.resolve();
    }

    if (context.zip) {
      return Promise.resolve();
    }

    context.logProvider.debug(`Fetching template zip from source code: ${JSON.stringify(context)}`);
    //! This path only works in debug mode
    const templateSourceCodePath = path.resolve(
      __dirname,
      "../../../../../",
      "templates",
      context.name
    );

    context.zip = zipFolder(templateSourceCodePath);
    return Promise.resolve();
  },
};

export const downloadDirectoryAction: GeneratorAction = {
  name: GeneratorActionName.DownloadDirectory,
  run: async (context: GeneratorContext) => {
    context.logProvider.debug(`Downloading sample by directory: ${JSON.stringify(context)}`);
    if (!context.sampleInfo) {
      throw new MissKeyError("sampleInfo");
    }

    context.outputs = await downloadDirectory(context.sampleInfo, context.destination);
  },
};

export const fetchTemplateUrlWithTagAction: GeneratorAction = {
  name: GeneratorActionName.FetchTemplateUrlWithTag,
  run: async (context: GeneratorContext) => {
    if (context.zip || context.url || context.cancelDownloading) {
      return;
    }

    context.logProvider.debug(`Fetching template url with tag: ${JSON.stringify(context)}`);
    context.url = await fetchTemplateZipUrl(context.name, context.tryLimits, context.timeoutInMs);
  },
};

export const fetchZipFromUrlAction: GeneratorAction = {
  name: GeneratorActionName.FetchZipFromUrl,
  run: async (context: GeneratorContext) => {
    if (context.zip || context.cancelDownloading) {
      return;
    }

    context.logProvider.debug(`Fetching zip from url: ${JSON.stringify(context)}`);
    if (!context.url) {
      throw new MissKeyError("url");
    }
    context.zip = await fetchZipFromUrl(context.url, context.tryLimits, context.timeoutInMs);
  },
};

export const fetchTemplateFromLocalAction: GeneratorAction = {
  name: GeneratorActionName.FetchTemplateZipFromLocal,
  run: async (context: GeneratorContext) => {
    if (context.outputs?.length) {
      return;
    }
    context.logProvider.debug(`Fetching zip from local: ${JSON.stringify(context)}`);
    context.fallback = true;
    const fallbackPath = path.join(getTemplatesFolder(), "fallback");
    const fileName = `${context.name}.zip`;
    const zipPath: string = path.join(fallbackPath, fileName);

    const data: Buffer = await fs.readFile(zipPath);
    context.zip = new AdmZip(data);
    context.outputs = await unzip(
      context.zip,
      context.destination,
      context.fileNameReplaceFn,
      context.fileDataReplaceFn,
      context.filterFn
    );
  },
};

export const unzipAction: GeneratorAction = {
  name: GeneratorActionName.Unzip,
  run: async (context: GeneratorContext) => {
    if (!context.zip) {
      return;
    }
    context.logProvider.debug(`Unzipping: ${JSON.stringify(context)}`);
    context.outputs = await unzip(
      context.zip,
      context.destination,
      context.fileNameReplaceFn,
      context.fileDataReplaceFn,
      context.filterFn
    );
  },
};

export const TemplateActionSeq: GeneratorAction[] = [
  fetchTemplateZipFromSourceCodeAction,
  fetchTemplateUrlWithTagAction,
  fetchZipFromUrlAction,
  unzipAction,
  fetchTemplateFromLocalAction,
];

export const SampleActionSeq: GeneratorAction[] = [fetchZipFromUrlAction, unzipAction];
export const DownloadDirectoryActionSeq: GeneratorAction[] = [downloadDirectoryAction];
