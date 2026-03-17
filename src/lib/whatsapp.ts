import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import { parseMessage } from "./parser";
import { prisma } from "./prisma";

const AUTH_PATH = path.join(process.cwd(), "baileys_auth");

let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCodeData: string | null = null;
let isConnected = false;

export function getQRCode() {
  return qrCodeData;
}

export function getConnectionStatus() {
  return isConnected;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeData = qr;
      isConnected = false;
    }

    if (connection === "open") {
      console.log("WhatsApp conectado!");
      isConnected = true;
      qrCodeData = null;
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("Reconectando WhatsApp...");
        startWhatsApp();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text;

      if (!text) continue;

      try {
        const parsed = await parseMessage(text);

        await prisma.transaction.create({
          data: {
            tipo: parsed.tipo,
            descricao: parsed.descricao,
            produto: parsed.produto,
            categoria: parsed.categoria,
            quantidade: parsed.quantidade,
            valorUnitario: parsed.valor_unitario,
            valorTotal: parsed.valor_total,
            formaPagamento: parsed.forma_pagamento,
            data: new Date(parsed.data),
            mensagemOriginal: text,
          },
        });

        console.log(`Transação registrada: ${parsed.descricao}`);
      } catch (err) {
        console.error("Erro ao processar mensagem:", err);
      }
    }
  });
}
