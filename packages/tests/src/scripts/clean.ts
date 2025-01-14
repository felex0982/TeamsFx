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
  const cleanService = await GraphApiCleanHelper.create(
    Env.cleanTenantId,
    Env.cleanClientId,
    Env.username,
    Env.password
  );

  console.log(`clean teams app (exclude ${excludePrefix})`);
  const teamsUserId = await cleanService.getUserIdByName(Env.username);
  const teamsAppList = await cleanService.listTeamsApp(teamsUserId);
  if (teamsAppList) {
    for (const app of teamsAppList) {
      for (const name of appNamePrefixList) {
        if (
          app?.teamsAppDefinition?.displayName?.startsWith(name) &&
          !app?.teamsAppDefinition?.displayName?.startsWith(excludePrefix)
        ) {
          console.log(app?.teamsAppDefinition?.displayName);
          try {
            await cleanService.uninstallTeamsApp(teamsUserId, app?.id ?? "");
          } catch {
            console.log(
              `Failed to uninstall Teams App ${app?.teamsAppDefinition?.displayName}`
            );
          }
        }
      }
    }
  }

  console.log(`clean AAD (exclude ${excludePrefix})`);
  const aadList = await cleanService.listAad();
  if (aadList) {
    for (const aad of aadList) {
      for (const name of aadNamePrefixList) {
        if (
          aad.displayName?.startsWith(name) &&
          !aad.displayName?.startsWith(excludePrefix)
        ) {
          console.log(aad.displayName);
          await cleanService.deleteAad(aad.id!);
        }
      }
    }
  }

  console.log(`clean app in app studio`);
  const addStudioCleanService = await AppStudioCleanHelper.create(
    Env.cleanTenantId,
    Env.cleanClientId,
    Env.username,
    Env.password
  );
  const appStudioAppList = await addStudioCleanService.getAppsInAppStudio();
  if (appStudioAppList) {
    for (const app of appStudioAppList) {
      for (const name of appStudioAppNamePrefixList) {
        if (
          app?.displayName?.startsWith(name) &&
          !app?.displayName?.startsWith(excludePrefix)
        ) {
          console.log(app?.displayName);
          try {
            await addStudioCleanService.deleteAppInAppStudio(
              app?.appDefinitionId
            );
          } catch {
            console.log(
              `Failed to delete Teams App ${app?.displayName} in App Studio`
            );
          }
        }
      }
    }
  }

  console.log(
    `clean up the Azure resource group with name start with ${Project.namePrefix} (exclude ${excludePrefix})`
  );
  const rgNameList: string[] = [];
  for (const name of rgNamePrefixList) {
    const group = await filterResourceGroupByName(name);
    group.map((rgName) => rgNameList.push(rgName));
  }
  if (rgNameList.length > 0) {
    for (const rgName of rgNameList) {
      for (const name of rgNamePrefixList) {
        if (rgName.startsWith(name) && !rgName.startsWith(excludePrefix)) {
          await deleteResourceGroupByName(rgName);
        }
      }
    }
  }

  console.log(`clean SharePoint app package files`);
  const sharePointCleanService = await SharePointApiCleanHelper.create(
    Env.cleanTenantId,
    Env.cleanClientId,
    Env.username,
    Env.password
  );
  const sharePointAppList = await sharePointCleanService.listApp();
  if (sharePointAppList) {
    for (const app of sharePointAppList) {
      for (const name of appNamePrefixList) {
        if (
          app.Title?.startsWith(name) &&
          !app.Title?.startsWith(excludePrefix)
        ) {
          console.log(app.Title);
          await sharePointCleanService.deleteApp(app.ID!);
        }
      }
    }
  }

  console.log(`clean dev tunnel`);
  const devTunnelCleanHelper = await DevTunnelCleanHelper.create(
    Env.cleanTenantId,
    Env.username,
    Env.password
  );
  await devTunnelCleanHelper.deleteAll();

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
        if (
          acquisition.titleDefinition.name.startsWith(name) &&
          !acquisition.titleDefinition.name.startsWith(excludePrefix)
        ) {
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
