import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { TextDecoder } from 'util';
import {
  Client,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TransactionRecordQuery,
  PrivateKey,
  AccountId,
  HbarUnit,
  Hbar,
} from '@hashgraph/sdk';
import { getAccountIdfromTxId } from '../lib/utils.ts';

const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: '*',
  },
});
const redisClient = new Redis(
  `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
);
const topicId = process.env.NEXT_PUBLIC_TOPIC_ID!;
const agentAccount = process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID1;
const agentKey = PrivateKey.fromStringECDSA(process.env.AGENT_PRIVATE_KEY!);

const hederaClient = Client.forTestnet();
hederaClient.setOperator(
  AccountId.fromString(process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID!),
  agentKey
);

runService();

function runService() {
  app.get('/', (req, res) => {
    res.json({ msg: 'Welcome agent' });
  });

  http.listen(8080, function () {
    console.log('server running on http://localhost:' + 8080);
    subscribeToTopic(topicId);
    io.on('connection', function (client) {
      const connectMessage = {
        client: client.id,
        topicId,
      };
      io.emit('connect message', JSON.stringify(connectMessage));
      client.on('message', async function (msg) {
        const payload = JSON.parse(msg);
        try {
          const checkTransactionId = await redisClient.get(
            payload.transactionId
          );
          if (checkTransactionId) return;
          // Get transaction details
          const transactionRecord = await new TransactionRecordQuery()
            .setTransactionId(payload.transactionId)
            .execute(hederaClient);
          // Check if transaction was successful
          if (transactionRecord.receipt.status.toString() !== 'SUCCESS') return;
          // Find transfer to agent account
          const agentTransfer = transactionRecord.transfers.find(
            (transfer) =>
              transfer.accountId.toString() ===
              process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID
          );
          // Verify agent received 5 HBAR
          if (
            !agentTransfer ||
            agentTransfer.amount.toString() !==
              new Hbar(5, HbarUnit.Hbar).toString()
          ) {
            console.log(
              'Payment verification failed: Incorrect amount received'
            );
            return;
          }
          console.log('Payment verified: Agent received 5 HBAR');
          // Process the message now that payment is verified
          await publishMessageToTopic(
            topicId,
            JSON.stringify({
              msg: payload.message,
              from: getAccountIdfromTxId(payload.transactionId),
            })
          );
          // make api call to LLM with possible prompt and users message

          // RESPONSE from agent
          await publishMessageToTopic(
            topicId,
            JSON.stringify({
              msg: 'Agents response',
              from: 'agent',
            })
          );
          // store transaction id in database to mark it as processed
          await redisClient.set(payload.transactionId, 'processed');
        } catch (error) {
          console.error('Error verifying transaction:', error);
        }
      });
      client.on('disconnect', function () {
        const disconnect = {
          operatorAccount: agentAccount,
          client: client.id,
        };
        io.emit('disconnect message', JSON.stringify(disconnect));
      });
    });
  });
}

async function publishMessageToTopic(topicId: string, msg: string) {
  const submitMsgTx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(msg)
    .freezeWith(hederaClient)
    .sign(agentKey);
  const submitMsgTxSubmit = await submitMsgTx.execute(hederaClient);
  const getReceipt = await submitMsgTxSubmit.getReceipt(hederaClient);
  const transactionStatus = getReceipt.status;
  return transactionStatus;
}

function subscribeToTopic(topicId: string) {
  try {
    new TopicMessageQuery().setTopicId(topicId).subscribe(
      hederaClient,
      (error) => {
        console.log('Message subscriber raised an error', error);
      },
      (message) => {
        const mirrorMessage = new TextDecoder().decode(message.contents);
        const messageJson = JSON.parse(mirrorMessage);
        const messageToUI = {
          message: messageJson.msg,
          from: messageJson.from,
          sequence: message.sequenceNumber.toString(10), // sequence number is a big integer
        };
        io.emit('message', JSON.stringify(messageToUI));
      }
    );
  } catch (error) {
    console.log('ERROR:', error);
    process.exit(1);
  }
}
