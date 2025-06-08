import * as awsx from "@pulumi/awsx";

import { cluster } from "../cluster";
import { orderDockerImage } from "../images/orders";

export const ordersService = new awsx.classic.ecs.FargateService(
  "farget-orders",
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
      container: {
        image: orderDockerImage.ref,
        cpu: 256,
        memory: 512,
      },
    },
  }
);
