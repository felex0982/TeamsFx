// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { Project } from "../utils/constants";
import { Env } from "../utils/env";
import {
  AppStudioCleanHelper,
  filterResourceGroupByName,
  deleteResourceGroupByName,
  GraphApiCleanHelper,
  SharePointApiCleanHelper,
  DevTunnelCleanHelper,
  M365TitleCleanHelper,
} from "../utils/cleanHelper";
import { getAppNamePrefix } from "../utils/nameUtil";

const appStudioAppNamePrefixList: string[] = [Project.namePrefix];
const appNamePrefixList: string[] = [Project.namePrefix];
const aadNamePrefixList: string[] = [Project.namePrefix];
const rgNamePrefixList: string[] = [Project.namePrefix];
const excludePrefix: string = getAppNamePrefix();

async function main() {
  const m365TitleCleanService = await M365TitleCleanHelper.create(
    Env.cleanTenantId,
    "7ea7c24c-b1f6-4a20-9d11-9ae12e9e7ac0",
    Env.username,
    Env.password
  );
  console.log(`clean M365 Titles (exclude ${excludePrefix})`);
  const acquisitions = await m365TitleCleanService.listAcquisitions();
  if (acquisitions) {
    for (const acquisition of acquisitions) {
      for (const name of appNamePrefixList) {
        if (!acquisition.titleDefinition.name.startsWith(excludePrefix)) {
          console.log(acquisition.titleDefinition.name);
          console.log(acquisition.titleId);
          await m365TitleCleanService.unacquire(acquisition.titleId);
        }
      }
    }
  }
}

main()
  .then((_) => {
    console.log("Clean Job Done.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(-1);
  });
