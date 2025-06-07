import "@opentelemetry/auto-instrumentations-node/register";

import { fastify } from "fastify";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { fastifyCors } from "@fastify/cors";
import { trace } from "@opentelemetry/api";
import { z } from "zod";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { schema } from "../database/schema/index.ts";
import { clientDatabase } from "../database/client.ts";
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";
import { tracer } from "../tracer/tracer.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, { origin: "*" });

/* Escalonamento horizontal */
/* Deplloy: Blue-green deployment */
app.get("/health", () => {
  return "OK";
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (req, rep) => {
    const { amount } = req.body;

    console.log("Creating an order with amount ", amount);

    const orderId = randomUUID();
    const customerId = "4bb2ef2f-0b13-4368-83fb-fbd2dcab545c";

    try {
      await clientDatabase.insert(schema.orders).values({
        id: orderId,
        customerId,
        amount,
      });
    } catch (error) {
      console.log(error);
    }

    /* Adicionando atributos personalizados dentro do tracing do jaegear */
    trace.getActiveSpan()?.setAttribute("order_id", orderId);

    /* Verificar exatamente as etapas que estao demorando ou dando algum problema no codigo */
    /* const span = tracer.startSpan("Eu acho que aqui esta demorando muito....");

    span.setAttribute("order_id", orderId);

    await setTimeout(2000);

    span.end(); */

    dispatchOrderCreated({
      orderId,
      amount,
      customer: {
        id: customerId,
      },
    });

    return rep.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3333 }).then(() => {
  console.log("[Orders] Server is running");
});
