import {
  Client,
  PrivateKey,
  AccountId,
  Hbar,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';

const operatorIdStr = process.env.NEXT_PUBLIC_AGENT_ACCOUNT_ID;
const operatorKeyStr = process.env.AGENT_PRIVATE_KEY;

if (!operatorIdStr || !operatorKeyStr) {
  throw new Error('Must set NEXT_PUBLIC_AGENT_ACCOUNT_ID, AGENT_PRIVATE_KEY');
}
const operatorId = AccountId.fromString(operatorIdStr);
const operatorKey = PrivateKey.fromStringECDSA(operatorKeyStr);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));
client.setDefaultMaxQueryPayment(new Hbar(50));

const submitMsgTx = await new TopicMessageSubmitTransaction({
  topicId: process.env.NEXT_PUBLIC_TOPIC_ID,
  message: 'Submitkey set!',
})
  .freezeWith(client)
  .sign(operatorKey);

const submitMsgTxSubmit = await submitMsgTx.execute(client);

// Get the receipt of the transaction
const getReceipt = await submitMsgTxSubmit.getReceipt(client);

// Get the status of the transaction
const transactionStatus = getReceipt.status;
console.log('The message transaction status ' + transactionStatus.toString());
