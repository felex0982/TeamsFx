// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { CLICommand, LogLevel, err, ok } from "@microsoft/teamsfx-api";
import { PackageService, isCliV3Enabled } from "@microsoft/teamsfx-core";
import { logger } from "../../commonlib/logger";
import { MissingRequiredOptionError } from "../../error";
import { TelemetryEvent } from "../../telemetry/cliTelemetryEvents";
import { m365utils, sideloadingServiceEndpoint } from "./m365Sideloading";

const commandName = isCliV3Enabled() ? "uninstall" : "unacquire";

export const m365UnacquireCommand: CLICommand = {
  name: commandName,
  aliases: isCliV3Enabled() ? ["unacquire"] : ["uninstall"],
  description: "Remove an acquired M365 App.",
  options: [
    {
      name: "title-id",
      description: "Title ID of the acquired M365 App.",
      type: "string",
    },
    {
      name: "manifest-id",
      description: "Manifest ID of the acquired M365 App.",
      type: "string",
    },
  ],
  examples: [
    {
      command: `${process.env.TEAMSFX_CLI_BIN_NAME} m365 ${commandName} --title-id U_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
      description: "Remove the acquired M365 App by Title ID",
    },
    {
      command: `${process.env.TEAMSFX_CLI_BIN_NAME} m365 ${commandName} --manifest-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`,
      description: "Remove the acquired M365 App by Manifest ID",
    },
  ],
  telemetry: {
    event: TelemetryEvent.M365Unacquire,
  },
  defaultInteractiveOption: false,
  handler: async (ctx) => {
    // Command is preview, set log level to verbose
    logger.logLevel = logger.logLevel > LogLevel.Verbose ? LogLevel.Verbose : logger.logLevel;
    logger.warning("This command is in preview.");
    const packageService = new PackageService(sideloadingServiceEndpoint, logger);
    let titleId = ctx.optionValues["title-id"] as string;
    const manifestId = ctx.optionValues["manifest-id"] as string;
    if (titleId === undefined && manifestId === undefined) {
      return err(
        new MissingRequiredOptionError(ctx.command.fullName, `--title-id or --manifest-id`)
      );
    }
    const tokenAndUpn = await m365utils.getTokenAndUpn();
    if (titleId === undefined) {
      titleId = await packageService.retrieveTitleId(tokenAndUpn[0], manifestId);
    }
    await packageService.unacquire(tokenAndUpn[0], titleId);
    return ok(undefined);
  },
};
